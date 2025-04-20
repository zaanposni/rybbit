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

    const width = 900;
    const height = 500;
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

    journeyData.slice(0, 10).forEach((journey) => {
      for (let i = 0; i < journey.path.length; i++) {
        const stepName = journey.path[i];
        const stepKey = `${i}_${stepName}`;

        if (!nodes.find((n) => n.id === stepKey)) {
          nodes.push({
            id: stepKey,
            name: stepName,
            step: i,
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

    // Create links as bezier curves
    g.selectAll(".link")
      .data(links)
      .join("path")
      .attr("class", "link")
      .attr("d", (d) => {
        const source = nodes.find((n) => n.id === d.source);
        const target = nodes.find((n) => n.id === d.target);

        if (!source || !target) return "";

        const sourceX = source.x + 10;
        const sourceY = source.y;
        const targetX = target.x - 10;
        const targetY = target.y;

        const linkWidth = Math.min(10, Math.max(1, Math.log(d.value) * 2));

        return `M ${sourceX},${sourceY} 
                C ${sourceX + stepWidth / 2},${sourceY} 
                  ${targetX - stepWidth / 2},${targetY} 
                  ${targetX},${targetY}`;
      })
      .attr("fill", "none")
      .attr("stroke", "#0066cc")
      .attr("stroke-width", (d) =>
        Math.max(1, Math.min(10, Math.log(d.value) * 2))
      )
      .attr("opacity", 0.6);

    // Create nodes
    const nodeGroups = g
      .selectAll(".node")
      .data(nodes)
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    nodeGroups.append("circle").attr("r", 6).attr("fill", "#0066cc");

    nodeGroups
      .append("text")
      .attr("x", 10)
      .attr("y", 4)
      .text((d) => d.name)
      .attr("font-size", "12px")
      .attr("text-anchor", "start");

    // Add step labels at the top
    for (let i = 0; i < steps; i++) {
      g.append("text")
        .attr("x", i * stepWidth)
        .attr("y", -5)
        .text(`Step ${i + 1}`)
        .attr("font-size", "12px")
        .attr("font-weight", "bold");
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
              <Skeleton className="h-[500px] w-full rounded-md" />
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
              <svg ref={svgRef} className="w-full h-[500px]" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
