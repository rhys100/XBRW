import {setBuiltInOn, type BuiltInFeed} from "@/library/builtInFeeds";
import {parseSubscriptions, subscriptionFor} from "@/library/roasterSubscription";
import {setPinned} from "@/library/roasterSync";
import type {Settings} from "@/library/Settings";

/**
 * FORK-ONLY (ccc/main): the Central Coast Coffee feed this build ships with.
 * Never offered upstream. See FORK.md.
 */
export const CCC_FEED_URL = "https://www.centralcoastcoffee.com.au/collections/roasted-coffee-beans?view=xbrw";

const CCC_FEED: BuiltInFeed = {
    feed:        CCC_FEED_URL,
    roaster:     "Central Coast Coffee",
    description: "Central Coast Coffee's roasted coffees."
};

/**
 * Subscribe this install to Central Coast Coffee, once.
 *
 * `cccFeedSeeded` is what makes it once: it is set whether or not a
 * subscription was added, and it is not in a backup, so somebody who
 * unsubscribes never gets it back, on any later launch or restore.
 *
 * It only writes settings. The subscription is a never-synced one, the same
 * record a built-in feed starts as, so the next ordinary sync reads it and a
 * phone with no connection simply has a roaster whose coffees are still
 * loading. No fetch, so no failure to report, and no offer sheet.
 *
 * Show in Import is what puts it on the home strip. That has room for three, so
 * on a full list the subscription stays and is not shown there.
 */
export function seedCccFeed(settings: Settings, now: number): void {
    if (settings.get("cccFeedSeeded")) return;
    const subscriptions = parseSubscriptions(settings.get("roasterSubscriptions"));
    if (subscriptionFor(subscriptions, CCC_FEED_URL) === undefined) {
        setBuiltInOn(settings, CCC_FEED, true);
        setPinned(settings, CCC_FEED_URL, true, now);
    }
    settings.set("cccFeedSeeded", true);
}
