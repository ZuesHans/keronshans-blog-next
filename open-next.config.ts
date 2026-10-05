import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Keep the prerendered HTML and RSC payloads available in Workers. A dummy
// cache discards them, making generateStaticParams article routes return 404.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
