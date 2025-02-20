"use client";

import { DateTime } from "luxon";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { useListUsers } from "../../../hooks/api";
import { AddUser } from "./AddUser";

export function Users() {
  const { data: users, refetch } = useListUsers();

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-2">
        <CardHeader>
          <CardTitle className="text-xl flex justify-between items-center">
            Users
            <AddUser />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.data?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.role || "admin"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {DateTime.fromISO(user.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {user.name !== "admin" && (
                      <Button variant={"destructive"} size={"sm"}>
                        Delete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {/* <TableRow>
                <TableCell>Paid</TableCell>
                <TableCell>Credit Card</TableCell>
              </TableRow> */}
            </TableBody>
          </Table>
        </CardContent>
        {/* <CardFooter className="flex justify-end">
          <Button variant={"accent"} disabled={!hasChanges}>
            Save Changes
          </Button>
        </CardFooter> */}
      </Card>
    </div>
  );
}
