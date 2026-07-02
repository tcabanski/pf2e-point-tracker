This simple module lets you easily add counters to a token to keep track of any point systems you like. For example, chase points, research points, victory points, or any other PF2E/SF2E counter. Drag the point tracker effect from the compendium onto a token for the default single-counter behavior, then increase and decrease the value like any other PF2E effect, such as frightened.

For multiple counters on the same actor, use the `Create Point Tracker` macro from the Point Tracker Macros compendium. Drag it to your hotbar, select one or more tokens, and run it. The macro opens a dialog for tracker name, starting value, minimum value, optional maximum value, and icon style. Trackers created this way can use different visual styles, and each style has its own token effect icon path so multiple trackers with the same value can still all appear in the PF2E effects halo.

Macro-created tracker effects use the same styled counter image in the selected-token effects list, so the token halo and selected-token controls visually match. The example below shows one token with three different trackers. Existing v2.0.0 trackers can be updated by selecting their token and running `game.pf2ePointTracker.syncTrackerIcons()`.

![](docs/example.png)

## Making a Release
* Update the following fields in module.json
    * download: Update the version part of url to match the version tag of the release (e.g. v1.1.1 where 1.1.1 is the version number)
    * version: The version number of this release
* Build module.zip with `npm run build` or `node tools/build-release.js`. The release zip includes:
    * assets/
    * docs/
    * packs/
    * scripts/
    * module.json
    * readme.md
* Check in and push
* Create the release in Github with version number as title and v{version number} as a new tag
* Add module.zip and module.json to the release
* Add a release to the package in Foundry community settings
