/*jshint browser:true */
/*global define */

define(
["ui", "router", "resource", "ist!templates/new-share", "ist!templates/settings"],
function(ui, router, resource, popupTemplate, settingsTemplate) {
	"use strict";


	/*!
	 * Fill views when UI starts
	 */

	var popupView;
	var popupRendered;
	var popupContext = { loading: true };


	ui.started.add(function() {
		/* Setup settings pane */

		var settingsView = ui.view("share-settings");
		var settingsRendered = settingsTemplate.render({ shares: [] });

		settingsView.appendChild(settingsRendered);

		function updateSettings() {
			return resource.get().then(function(shares) {
				settingsRendered.update({ shares: shares._items });
			});
		}

		settingsView.displayed.add(updateSettings);


		/* Setup settings routes */

		router.on("!remove/:id", function(err, req, next) {
			resource.remove(req.match.id)
			.then(updateSettings)
			.then(function() { next(); });
		});

		router.on("!disable/:id", function(err, req, next) {
			resource.disable(req.match.id)
			.then(updateSettings)
			.then(function() { next(); });
		});

		router.on("!enable/:id", function(err, req, next) {
			resource.enable(req.match.id)
			.then(updateSettings)
			.then(function() { next(); });
		});


		/* Setup new share popup */

		popupView = ui.view("new-share");
		popupRendered = popupTemplate.render(popupContext);
		popupView.appendChild(popupRendered);

		popupView.undisplayed.add(function() {
			popupContext.loading = true;
			popupContext.share = null;
			popupContext.behaviour = null;

			popupRendered.update();
		});
	});


	/*!
	 * Plugin manifest
	 */

	return {
		views: {
			"share-settings": {
				type: "settings",
				title: "Shares",
				description: "Manage shared resources",
				icon: "share"
			},

			"new-share": {
				type: "popup"
			}
		},

		public: function shareResource(provider, id, description) {
			popupView.show();

			resource.add(provider, id, description)
			.then(function(share) {
				popupContext.loading = false;
				popupContext.share = share;
				popupContext.behaviour = {
					".cancel": {
						"click": function() {
							popupView.hide();
							resource.remove(share.shortId);
						}
					},

					".share": {
						"click": function() {
							popupView.hide();
							resource.enable(share.shortId);
						}
					}
				};

				popupRendered.update();
			})
			.otherwise(function(err) {
				popupView.hide();
				ui.error("Cannot share resource", err.message);
			});
		}
	};
});