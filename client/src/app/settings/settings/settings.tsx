import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

export function Settings() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="p-2">
        <CardHeader>
          <CardTitle className="text-xl">Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                className="w-60"
                id="username"
                value={username}
                onChange={({ target }) => setUsername(target.value)}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                className="w-60"
                id="email"
                type="email"
                value={email}
                onChange={({ target }) => setEmail(target.value)}
              />
            </div> */}
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
