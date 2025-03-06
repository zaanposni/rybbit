import { Skeleton } from "@/components/ui/skeleton";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Avatar from "boring-avatars";
import { DateTime } from "luxon";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { getCountryName } from "../../../../lib/utils";
import { Browser } from "../../components/shared/icons/Browser";
import { CountryFlag } from "../../components/shared/icons/CountryFlag";
import { OperatingSystem } from "../../components/shared/icons/OperatingSystem";

type Session = {
  session_id: string;
  user_id: string;
  country: string;
  iso_3166_2: string;
  language: string;
  device_type: string;
  browser: string;
  operating_system: string;
  referrer: string;
  last_pageview_timestamp: string;
  pageviews: number;
};

interface SessionsTableProps {
  data: Session[];
  isLoading: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
}

// Skeleton row component for loading state
const SkeletonRow = ({ columns }: { columns: number }) => {
  return (
    <tr className="bg-neutral-900">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-3 whitespace-nowrap">
          <Skeleton className="h-6 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
};

export default function SessionsTable({
  data,
  isLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: SessionsTableProps) {
  const { site } = useParams();
  const router = useRouter();

  // Reference for the scroll container
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll implementation
  useEffect(() => {
    const handleScroll = () => {
      if (!tableContainerRef.current) return;

      const { scrollHeight, scrollTop, clientHeight } =
        tableContainerRef.current;

      // Load more when user scrolls to bottom (with a 200px buffer)
      if (
        scrollHeight - scrollTop - clientHeight < 200 &&
        !isFetchingNextPage &&
        hasNextPage
      ) {
        fetchNextPage();
      }
    };

    const tableContainer = tableContainerRef.current;
    if (tableContainer) {
      tableContainer.addEventListener("scroll", handleScroll);
      return () => {
        tableContainer.removeEventListener("scroll", handleScroll);
      };
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Column definition
  const columnHelper = createColumnHelper<Session>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("user_id", {
        header: "User",
        cell: (info) => {
          const userId = info.getValue();
          return (
            <Avatar
              name={userId}
              colors={["#2c2b4b", "#a75293", "#9c7a9d", "#9ddacb", "#f8dcb4"]}
              variant="beam"
              size={30}
            />
          );
        },
      }),
      columnHelper.accessor("last_pageview_timestamp", {
        header: "Last Seen",
        cell: (info) => {
          return DateTime.fromSQL(info.getValue()).toFormat(
            "MMM d, yyyy h:mm a"
          );
        },
      }),
      columnHelper.accessor("pageviews", {
        header: "Pageviews",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("country", {
        header: "Country",
        cell: (info) =>
          info.getValue() ? (
            <div className="flex items-center gap-2">
              <CountryFlag country={info.getValue() || "Unknown"} />
              {getCountryName(info.getValue() || "Unknown")}
            </div>
          ) : (
            "-"
          ),
      }),
      columnHelper.accessor("browser", {
        header: "Browser",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Browser browser={info.getValue() || "Unknown"} />
            {info.getValue() || "Unknown"}
          </div>
        ),
      }),
      columnHelper.accessor("operating_system", {
        header: "OS",
        cell: (info) =>
          info.getValue() ? (
            <div className="flex items-center gap-2">
              <OperatingSystem os={info.getValue()} />
              {info.getValue()}
            </div>
          ) : (
            "-"
          ),
      }),
      columnHelper.accessor("device_type", {
        header: "Device",
        cell: (info) => info.getValue() || "Unknown",
      }),
      columnHelper.accessor("referrer", {
        header: "Referrer",
        cell: (info) => info.getValue() || "-",
      }),
    ],
    [site]
  );

  // Table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div
      ref={tableContainerRef}
      className="overflow-auto rounded-lg bg-neutral-900 border border-neutral-800"
      style={{ height: "calc(100vh - 200px)" }}
    >
      <table className="min-w-full divide-y divide-neutral-500">
        <thead className="bg-neutral-900 sticky top-0">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left font-medium text-gray-400 tracking-wider"
                >
                  <div className="flex items-center">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-neutral-650">
          {isLoading ? (
            // Show 10 skeleton rows while loading
            Array.from({ length: 100 }).map((_, index) => (
              <SkeletonRow key={index} columns={columns.length} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-3">
                <div className="flex justify-center">No sessions found</div>
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => {
              return (
                <tr
                  key={row.id}
                  className="hover:bg-neutral-850 bg-neutral-900 cursor-pointer"
                  onClick={() =>
                    router.push(`/${site}/user/${row.original.user_id}`)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {isFetchingNextPage && (
        <div className="flex justify-center p-4">
          <div className="flex space-x-4">
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
      )}
    </div>
  );
}
