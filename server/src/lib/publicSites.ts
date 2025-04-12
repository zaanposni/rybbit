import { db } from "../db/postgres/postgres.js";
import { sites } from "../db/postgres/schema.js";

class PublicSites {
  private publicSitesMap: Map<number, boolean> = new Map();
  private initialized: boolean = false;

  async loadPublicSites() {
    try {
      const allSites = await db
        .select({
          siteId: sites.siteId,
          public: sites.public,
        })
        .from(sites);

      // Reset the map
      this.publicSitesMap.clear();

      // Populate the map with site IDs and their public status
      for (const site of allSites) {
        this.publicSitesMap.set(site.siteId, site.public || false);
      }

      this.initialized = true;
      console.log(
        `Loaded ${this.publicSitesMap.size} sites into public sites cache`
      );
    } catch (error) {
      console.error("Error loading public sites:", error);
      this.initialized = false;
    }
  }

  /**
   * Check if a site is public without hitting the database
   */
  isSitePublic(siteId: string | number): boolean {
    const numericSiteId = Number(siteId);
    return this.publicSitesMap.get(numericSiteId) || false;
  }

  /**
   * Update the public status of a site in the cache
   */
  updateSitePublicStatus(siteId: number, isPublic: boolean): void {
    this.publicSitesMap.set(siteId, isPublic);
  }

  /**
   * Add a new site to the cache
   */
  addSite(siteId: number, isPublic: boolean): void {
    this.publicSitesMap.set(siteId, isPublic);
  }

  /**
   * Remove a site from the cache
   */
  removeSite(siteId: number): void {
    this.publicSitesMap.delete(siteId);
  }

  /**
   * Ensure the cache is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.loadPublicSites();
    }
  }
}

// Singleton instance
export const publicSites = new PublicSites();
