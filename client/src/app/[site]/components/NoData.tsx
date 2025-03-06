import { CodeSnippet } from "../../../components/CodeSnippet";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { GetSitesResponse } from "../../../hooks/api";
import { BACKEND_URL } from "../../../lib/const";

export function NoData({
  siteMetadata,
}: {
  siteMetadata?: GetSitesResponse[number];
}) {
  return (
    <div className="flex justify-center items-center mt-5">
      <Card className="w-[500px] p-2">
        <CardHeader className="flex justify-center items-center">
          <div className="text-xl font-medium text-center w-full">
            Waiting for analytics from {siteMetadata?.domain}...
          </div>
          <div className="p-5">
            {/* @ts-ignore */}
            <l-ping size={50} color="hsl(var(--emerald-400))" speed="3" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="text-sm text-muted-foreground">
              Place this snippet in the &lt;head&gt; of your website
            </div>
            <CodeSnippet
              language="HTML"
              code={`<script\n    src="${BACKEND_URL}/script.js"\n    site-id="${siteMetadata?.siteId}"\n    defer\n/>`}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
