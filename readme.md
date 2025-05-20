This simple module lets you easily add a counter to a token to keep track of any point system you like.  For example, chase points in PF2E. Just drag the point tracker effect from the compendium onto any token. You can increase and decrease the value like any other PF2E effect, such as frightened.

![](docs/example.png)

## Making a Release
* Update the following fields in module.json
    * download: Update the version part of url to match the version tag of the release (e.g. v1.1.1 where 1.1.1 is the version number)
    * version: The version number of this release
* Create module.zip with the following files:
    * assets/
    * docs/
    * packs/
    * module.json
    * readme.md
* Check in and push
* Create the release in Github with version number as title and v{version number} as a new tag
* Add module.zip and module.json to the release
* Add a release to the package in Foundry community settings 