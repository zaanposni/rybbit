"use client";

import { useParams } from "next/navigation";
import { useJourneys } from "@/api/analytics/useJourneys";
import { useMemo, useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangeMode, Time } from "../../../components/DateSelector/types";
import { DateTime } from "luxon";
import { DateSelector } from "../../../components/DateSelector/DateSelector";

export default function JourneysPage() {
  const params = useParams<{ site: string }>();
  const [steps, setSteps] = useState<number>(3);

  const [time, setTime] = useState<Time>({
    mode: "range",
    startDate: DateTime.now().minus({ days: 7 }).toISODate(),
    endDate: DateTime.now().toISODate(),
    wellKnown: "Last 7 days",
  } as DateRangeMode);

  const { data, isLoading, error } = useJourneys({
    siteId: params.site,
    steps,
    timezone: "UTC",
    time,
  });

  const svgRef = useRef<SVGSVGElement>(null);

  const journeyData = useMemo(() => {
    if (!data?.journeys) return [];

    // Sort journeys by count (most popular first)
    return [...data.journeys].sort((a, b) => b.count - a.count);
  }, [data]);

  useEffect(() => {
    if (!journeyData.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1400;
    const height = 1000;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create the main group element
    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create a Sankey diagram
    // First, build nodes and links from journey data
    const nodes: any[] = [];
    const links: any[] = [];

    journeyData.slice(0, 25).forEach((journey) => {
      for (let i = 0; i < journey.path.length; i++) {
        const stepName = journey.path[i];
        const stepKey = `${i}_${stepName}`;

        if (!nodes.find((n) => n.id === stepKey)) {
          nodes.push({
            id: stepKey,
            name: stepName,
            step: i,
            incomingLinks: [],
            outgoingLinks: [],
          });
        }

        if (i < journey.path.length - 1) {
          const sourceKey = stepKey;
          const targetKey = `${i + 1}_${journey.path[i + 1]}`;

          const existingLink = links.find(
            (l) => l.source === sourceKey && l.target === targetKey
          );

          if (existingLink) {
            existingLink.value += journey.count;
          } else {
            links.push({
              source: sourceKey,
              target: targetKey,
              value: journey.count,
            });
          }
        }
      }
    });

    // Track incoming and outgoing links for each node
    links.forEach((link) => {
      const sourceNode = nodes.find((n) => n.id === link.source);
      const targetNode = nodes.find((n) => n.id === link.target);

      if (sourceNode) sourceNode.outgoingLinks.push(link);
      if (targetNode) targetNode.incomingLinks.push(link);
    });

    // Create scales for each step
    const stepWidth = innerWidth / steps;

    // Group nodes by step
    const nodesByStep = d3.group(nodes, (d) => d.step);

    // Position nodes vertically within each step
    nodesByStep.forEach((stepNodes, step) => {
      const stepX = step * stepWidth;
      const stepHeight = innerHeight / stepNodes.length;

      stepNodes.forEach((node, i) => {
        node.x = stepX;
        node.y = i * stepHeight + stepHeight / 2;
      });
    });

    // Find the maximum link value for scaling
    const maxLinkValue = d3.max(links, (link) => link.value) || 1;
    const linkWidthScale = d3
      .scaleLinear()
      .domain([0, maxLinkValue])
      .range([1, 100]);

    // Calculate node heights based on connected links
    nodes.forEach((node) => {
      // Sum the values of incoming and outgoing links
      const incomingValue = node.incomingLinks.reduce(
        (sum: number, link: any) => sum + link.value,
        0
      );
      const outgoingValue = node.outgoingLinks.reduce(
        (sum: number, link: any) => sum + link.value,
        0
      );

      // Use the larger value to determine height
      const maxValue = Math.max(incomingValue, outgoingValue);
      node.height = linkWidthScale(maxValue);

      // Minimum height for visibility
      node.height = Math.max(node.height, 10);

      // Store count for this node (use incoming for all except first step)
      node.count = node.step === 0 ? outgoingValue : incomingValue;
    });

    // Calculate link positions along each node
    nodes.forEach((node) => {
      // Sort links by value (descending) for consistent ordering
      node.incomingLinks.sort((a: any, b: any) => b.value - a.value);
      node.outgoingLinks.sort((a: any, b: any) => b.value - a.value);

      // Calculate positions for outgoing links
      let currentOutY = 0;
      const totalOutgoing = node.outgoingLinks.reduce(
        (sum: number, link: any) => sum + link.value,
        0
      );

      node.outgoingLinks.forEach((link: any) => {
        const linkHeight = linkWidthScale(link.value);
        // Position at the middle of the allocated segment
        link.sourceY = currentOutY + linkHeight / 2;
        // Update for next link
        currentOutY += linkHeight;
      });

      // Normalize positions to fit within node height
      if (totalOutgoing > 0 && node.outgoingLinks.length > 0) {
        node.outgoingLinks.forEach((link: any) => {
          link.sourceY =
            (link.sourceY / currentOutY) * node.height - node.height / 2;
          link.sourceY += node.y; // Adjust to node position
        });
      }

      // Calculate positions for incoming links
      let currentInY = 0;
      const totalIncoming = node.incomingLinks.reduce(
        (sum: number, link: any) => sum + link.value,
        0
      );

      node.incomingLinks.forEach((link: any) => {
        const linkHeight = linkWidthScale(link.value);
        // Position at the middle of the allocated segment
        link.targetY = currentInY + linkHeight / 2;
        // Update for next link
        currentInY += linkHeight;
      });

      // Normalize positions to fit within node height
      if (totalIncoming > 0 && node.incomingLinks.length > 0) {
        node.incomingLinks.forEach((link: any) => {
          link.targetY =
            (link.targetY / currentInY) * node.height - node.height / 2;
          link.targetY += node.y; // Adjust to node position
        });
      }
    });

    // Create links as bezier curves
    g.selectAll(".link")
      .data(links)
      .join("path")
      .attr("class", "link")
      .attr("d", (d) => {
        const source = nodes.find((n) => n.id === d.source);
        const target = nodes.find((n) => n.id === d.target);

        if (!source || !target) return "";

        // Get the specific Y positions for this link
        const sourceY = d.sourceY || source.y;
        const targetY = d.targetY || target.y;

        // Make links connect exactly to the bars (no gap)
        const sourceX = source.x + 10; // End of source bar (x + width)
        const targetX = target.x; // Start of target bar

        return `M ${sourceX},${sourceY} 
                C ${sourceX + stepWidth / 3},${sourceY} 
                  ${targetX - stepWidth / 3},${targetY} 
                  ${targetX},${targetY}`;
      })
      .attr("fill", "none")
      .attr("stroke", "hsl(var(--accent-500))")
      .attr("stroke-width", (d) => linkWidthScale(d.value))
      .attr("opacity", 0.6)
      // Add tooltips showing the exact count
      .append("title")
      .text((d) => `Count: ${d.value}`);

    // Create nodes as bars instead of circles
    const nodeGroups = g
      .selectAll(".node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y - d.height / 2})`);

    nodeGroups
      .append("rect")
      .attr("width", 10)
      .attr("height", (d) => d.height)
      .attr("fill", "hsl(var(--neutral-500))")
      .attr("rx", 2) // Rounded corners
      .attr("ry", 2);

    // Add a card background for text
    const textBackgrounds = nodeGroups
      .append("rect")
      .attr("x", 15)
      .attr("y", (d) => d.height / 2 - 10) // Position above the vertical center
      .attr("width", (d) => {
        // Estimate text width based on character count (approximate)
        const displayText = `${d.name} (${d.count})`;
        const textWidth = displayText.length * 6.5;
        return textWidth + 16; // Add padding
      })
      .attr("height", 20)
      .attr("fill", "hsl(var(--neutral-700))")
      .attr("stroke", "hsl(var(--neutral-600))")
      .attr("stroke-width", 1)
      .attr("rx", 2) // Rounded corners
      .attr("ry", 2)
      .attr("opacity", 0.8);

    nodeGroups
      .append("text")
      .attr("x", 23) // Add left padding inside card
      .attr("y", (d) => d.height / 2 + 4) // Center text vertically relative to the bar
      .text((d) => `${d.name} (${d.count})`)
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("text-anchor", "start");

    // Add step labels at the top with cards too
    for (let i = 0; i < steps; i++) {
      const stepGroup = g
        .append("g")
        .attr("transform", `translate(${i * stepWidth}, -20)`);

      // Add card background
      stepGroup
        .append("rect")
        .attr("width", (d) => {
          const text = `Step ${i + 1}`;
          const textWidth = text.length * 7;
          return textWidth + 10;
        })
        .attr("height", 20)
        .attr("fill", "hsl(var(--red-500))")
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("opacity", 0.8);

      // Add text
      stepGroup
        .append("text")
        .attr("x", 5)
        .attr("y", 14)
        .text(`Step ${i + 1}`)
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", "white");
    }
  }, [journeyData, steps]);

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Journeys</CardTitle>
          <div className="flex justify-end items-center gap-2 mb-2">
            <DateSelector time={time} setTime={setTime} />
            <Select
              value={steps.toString()}
              onValueChange={(value) => setSteps(Number(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Number of steps" />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6].map((step) => (
                  <SelectItem key={step} value={step.toString()}>
                    {step} steps
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex flex-col space-y-4">
              <Skeleton className="h-[1000px] w-full rounded-md" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load journey data. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {journeyData.length === 0 && !isLoading && !error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Data</AlertTitle>
              <AlertDescription>
                No journey data found for the selected criteria.
              </AlertDescription>
            </Alert>
          )}

          {journeyData.length > 0 && (
            <div className="overflow-x-auto">
              <svg ref={svgRef} className="w-full h-[1000px]" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
