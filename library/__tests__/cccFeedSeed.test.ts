import {CCC_FEED_URL, seedCccFeed} from "@/library/cccFeedSeed";
import {parseSubscriptions} from "@/library/roasterSubscription";
import {selectedImportRoasters} from "@/library/roasterImport";
import {
    readSubscriptions, resetSyncLockForTests, subscribe, syncDue, unsubscribe
} from "@/library/roasterSync";
import {feedBody, memorySettings} from "@/test-utils/roasterFeed";

jest.mock("@/library/XBloomRecipe", () => ({__esModule: true, XBloomRecipe: class {}}));
jest.mock("@/library/RecipeDatabase", () => ({
    __esModule: true, default: class { constructor() { throw new Error("must not open the recipe table"); } }
}));

const NOW = 2_000_000_000_000;

beforeEach(() => resetSyncLockForTests());

describe("seeding Central Coast Coffee", () => {
    it("subscribes a fresh install, chosen for Show in Import, without fetching", () => {
        const settings = memorySettings();
        seedCccFeed(settings, NOW);

        const [sub, ...rest] = readSubscriptions(settings);
        expect(rest).toEqual([]);
        expect(sub).toMatchObject({
            feed: CCC_FEED_URL, roaster: "Central Coast Coffee", lastSync: 0, lastAttempt: 0, paused: false
        });
        expect(selectedImportRoasters(readSubscriptions(settings)).map(s => s.feed)).toEqual([CCC_FEED_URL]);
        expect(settings.get("roasterCatalogue")).toBe("");
    });

    it("adds it beside an existing install's subscriptions", () => {
        const settings = memorySettings();
        const {feed, body} = feedBody([{id: "a"}]);
        subscribe(settings, "https://other.example/feed.json", feed, body, 5);
        seedCccFeed(settings, NOW);
        expect(readSubscriptions(settings)).toHaveLength(2);
    });

    it("does nothing, and makes no duplicate, when already subscribed", () => {
        const settings = memorySettings();
        const {feed, body} = feedBody([{id: "a"}]);
        subscribe(settings, CCC_FEED_URL, feed, body, 5);
        const before = settings.get("roasterSubscriptions");

        seedCccFeed(settings, NOW);

        expect(settings.get("roasterSubscriptions")).toBe(before);
        expect(settings.get("cccFeedSeeded")).toBe(true);
    });

    it("runs once, so an unsubscribe stays gone", () => {
        const settings = memorySettings();
        seedCccFeed(settings, NOW);
        unsubscribe(settings, CCC_FEED_URL);

        seedCccFeed(settings, NOW + 1);

        expect(readSubscriptions(settings)).toEqual([]);
    });

    it("keeps the subscription when offline at first launch, with nothing thrown", async () => {
        const settings = memorySettings();
        seedCccFeed(settings, NOW);
        const fetchBody = jest.fn(async () => { throw new TypeError("Network request failed"); });

        const results = await syncDue({settings, fetchBody, now: () => NOW});

        expect(fetchBody).toHaveBeenCalledWith(CCC_FEED_URL, undefined);
        expect(results).toEqual([{ok: false, reason: "network"}]);
        expect(parseSubscriptions(settings.get("roasterSubscriptions"))[0]).toMatchObject({
            feed: CCC_FEED_URL, lastSync: 0, lastError: "network"
        });
    });

    it("reads the feed on the next ordinary sync, keeping the Import choice", async () => {
        const settings = memorySettings();
        seedCccFeed(settings, NOW);
        const {feed, body} = feedBody([{id: "a"}]);

        const results = await syncDue({settings, fetchBody: async () => ({feed, body}), now: () => NOW});

        expect(results[0].ok).toBe(true);
        expect(selectedImportRoasters(readSubscriptions(settings)).map(s => s.feed)).toEqual([CCC_FEED_URL]);
    });

    it("stays subscribed when Show in Import is already full", () => {
        const settings = memorySettings();
        settings.set("roasterSubscriptions", JSON.stringify(["a", "b", "c"].map((name, index) => ({
            feed: `https://${name}.example/feed.json`, roaster: name, lastSync: 1, lastAttempt: 1,
            paused: false, pinnedAt: index + 1
        }))));

        seedCccFeed(settings, NOW);

        const subs = readSubscriptions(settings);
        expect(subs).toHaveLength(4);
        expect(subs.find(s => s.feed === CCC_FEED_URL)?.pinnedAt).toBeUndefined();
    });
});
