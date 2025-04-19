import { CodeSnippet } from "../../../components/CodeSnippet";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { GetSitesResponse } from "../../../api/admin/sites";
import { BACKEND_URL } from "../../../lib/const";
import { StandardPage } from "../../../components/StandardPage";

export function NoData({
  siteMetadata,
}: {
  siteMetadata?: GetSitesResponse[number];
}) {
  return (
    <StandardPage>
      <div className="flex justify-center items-center mt-5">
        <Card className="w-[500px] p-2">
          <CardHeader className="flex justify-center items-center">
            <div className="text-xl font-medium text-center w-full">
              Waiting for analytics from {siteMetadata?.domain}...
            </div>
            <div className="p-5">
              <span className="relative flex h-6 w-6">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-6 w-6 rounded-full bg-green-500"></span>
              </span>
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
    </StandardPage>
  );
}
