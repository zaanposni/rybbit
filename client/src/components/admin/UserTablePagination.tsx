"use client";

import { Table } from "@tanstack/react-table";
import { AdminUser } from "@/types/admin";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  table: Table<AdminUser>;
  data: { users: AdminUser[]; total: number } | undefined;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: (value: { pageIndex: number; pageSize: number }) => void;
  isLoading: boolean;
}

export function UserTablePagination({
  table,
  data,
  pagination,
  setPagination,
  isLoading,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-neutral-400">
        {isLoading ? (
          <span>Loading users...</span>
        ) : (
          <>
            Showing{" "}
            <span className="font-semibold">
              {data?.users?.length
                ? pagination.pageIndex * pagination.pageSize + 1
                : 0}
            </span>{" "}
            to{" "}
            <span className="font-semibold">
              {data?.users?.length
                ? Math.min(
                    (pagination.pageIndex + 1) * pagination.pageSize,
                    data?.total || 0
                  )
                : 0}
            </span>{" "}
            of <span className="font-semibold">{data?.total || 0}</span> users
          </>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <div className="mr-4 flex items-center space-x-2">
          <span className="text-sm text-neutral-400">Page size:</span>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(value) => {
              setPagination({
                pageIndex: 0, // Reset to first page when changing page size
                pageSize: Number(value),
              });
            }}
          >
            <SelectTrigger className="h-8 w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage() || isLoading}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage() || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm text-neutral-400">
          {isLoading ? (
            <span>Loading...</span>
          ) : (
            <>
              Page{" "}
              <span className="font-semibold">
                {table.getState().pagination.pageIndex + 1}
              </span>{" "}
              of{" "}
              <span className="font-semibold">
                {Math.max(table.getPageCount(), 1)}
              </span>
            </>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage() || isLoading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage() || isLoading}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
