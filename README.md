Resource sharing plugin for nestor
==================================

This plugin enables other plugins to share resources, ie make them available for download to users without authorized access to nestor, with a random and short URL.  Shares can be manually revoked or suspended at any time.

Shared resources can also have limits, for example:

* A maximum number of downloads
* An expiration date
* A list of allowed client IP addresses

Sharing resources
-----------------

To share a resource, a plugin must :
- define a share provider function with the `share:provider` intent
- add a document to the `Share` model collection, with the provider name and a resource ID

It's then up to the share provider to resolve the resource ID to what is actually intended to be shared, and build the actual download file.  The `Share` model does not allow storing the actual contents of the download, instead it must be determined dynamically by the share provider function.


Internals
---------

### Models

`Share`: a model to store shared resources, along with their limits.  Each share has a provider name and a provider-specific resource ID.

### REST resources

`/shares/:id`: access to shared resource definitions.

### HTTP resources

`/downloads/:id`: download shared resource

### Intents

`share:provider`: used by plugins to declare a "share provider", that is, a handler that is able, given a resource ID, build a downloadable file.  This intent must be dispatched with the following arguments:

* the provider name
* the share provider function

The provider function is called when a shared resource is requested by a client, and receives the resource ID, a DownloadStreamBuilder object and a callback as arguments.  It should build the download using the DownloadStreamBuilder, and then call the callback (with an optional error argument).

DownloadStreamBuilder usage
---------------------------

A DownloadStreamBuilder provides methods to add contents to a download.  If multiple files have been added to the builder, a ZIP archive will be sent to the client.

* `DownloadStreamBuilder#addContent(name, content)` creates a new file named `name` with content `content`.  When building downloads with multiple files, `name` can be a relative path in the archive; parent directories are created automatically.
* `DownloadStreamBuilder#addFile(name, path)` adds an existing file `path` with name `name`.  When building downloads with multiple files, `name` can be a relative path in the archive; parent directories are created automatically.
* `DownloadStreamBuilder#addDirectory(name, path)` adds an existing directory `path`, including its contents, under relative path `name` in the archive.
* `DownloadStreamBuilder#setDownloadFilename(name)` sets the name of the file to be sent to the client.

The name of the file sent to the client is determined as follows:
* if `setDownloadFilename` has been called, the name it received
* otherwise, if the download contains a single file, the basename of this file
* otherwise, if the download contains a single directory, the basename of this directory with a ".zip" extension
* otherwise, "download.zip"
