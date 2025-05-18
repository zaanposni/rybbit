"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StandardPage } from "@/components/StandardPage";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { UsersTable } from "@/components/admin/UsersTable";
import { UserFilters } from "@/components/admin/UserFilters";
import { UserTablePagination } from "@/components/admin/UserTablePagination";
import { authClient } from "@/lib/auth";

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  const {
    // Data
    users,
    total,

    // Loading state
    isLoading,
    isError,

    // Table state
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    pagination,
    setPagination,
    globalFilter,
    setGlobalFilter,

    // Actions
    handleImpersonate,
  } = useAdminUsers();

  useEffect(() => {
    async function checkAdminPermission() {
      try {
        // Check if the user has impersonate permission (admin feature)
        const result = await authClient.admin.hasPermission({
          permissions: {
            user: ["impersonate"],
          },
        });
        setIsAdmin(result.data?.success ?? false);

        // Check if the user is currently impersonating
        const session = await authClient.getSession();
        // Check if impersonatedBy exists in the session data
        setIsImpersonating(Boolean(session.data?.session?.impersonatedBy));

        setIsCheckingAdmin(false);
      } catch (err) {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        console.error("Error checking admin status:", err);
      }
    }

    checkAdminPermission();
  }, []);

  // Function to stop impersonating
  const stopImpersonating = async () => {
    try {
      await authClient.admin.stopImpersonating();
      setIsImpersonating(false);
      window.location.reload();
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error(`Failed to stop impersonation: ${errorMessage}`);
      return false;
    }
  };

  const data = { users, total };

  // Handle impersonation with navigation
  const onImpersonate = async (userId: string) => {
    const success = await handleImpersonate(userId);
    if (success) {
      router.push("/");
    }
  };

  // If not admin, show access denied
  if (!isAdmin && !isCheckingAdmin) {
    return (
      <div className="container mt-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this page. Please contact an
            administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <StandardPage>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        {isImpersonating && (
          <Button onClick={stopImpersonating} variant="destructive">
            Stop Impersonating
          </Button>
        )}
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load users. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Filters */}
        <UserFilters
          table={
            {
              getColumn: (columnId: string) => {
                const getFilterValue = () =>
                  columnFilters.find((filter) => filter.id === columnId)
                    ?.value ?? "";

                const setFilterValue = (value: string) => {
                  const newFilters = columnFilters.filter(
                    (filter) => filter.id !== columnId
                  );
                  if (value) {
                    newFilters.push({ id: columnId, value });
                  }
                  setColumnFilters(newFilters);
                };

                return {
                  getFilterValue,
                  setFilterValue,
                };
              },
            } as any
          }
        />

        {/* Users Table */}
        <UsersTable
          data={data}
          isLoading={isLoading}
          pagination={pagination}
          setPagination={setPagination}
          sorting={sorting}
          setSorting={setSorting}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          onImpersonate={onImpersonate}
        />

        {/* Pagination */}
        <UserTablePagination
          table={
            {
              getCanPreviousPage: () => pagination.pageIndex > 0,
              getCanNextPage: () =>
                pagination.pageIndex <
                Math.ceil(total / pagination.pageSize) - 1,
              getPageCount: () => Math.ceil(total / pagination.pageSize),
              getState: () => ({ pagination }),
              setPageIndex: (index: number) =>
                setPagination({ ...pagination, pageIndex: index }),
              previousPage: () =>
                setPagination({
                  ...pagination,
                  pageIndex: Math.max(0, pagination.pageIndex - 1),
                }),
              nextPage: () =>
                setPagination({
                  ...pagination,
                  pageIndex: Math.min(
                    Math.ceil(total / pagination.pageSize) - 1,
                    pagination.pageIndex + 1
                  ),
                }),
            } as any
          }
          data={data}
          pagination={pagination}
          setPagination={setPagination}
          isLoading={isLoading}
        />
      </div>
    </StandardPage>
  );
}
