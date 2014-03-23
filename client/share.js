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
	var popupForm;
	var popupRendered;


	ui.started.add(function() {
		/* Setup settings pane */

		var settingsView = ui.view("share-settings");
		var settingsContext = { shares: [] };
		var settingsRendered = settingsTemplate.render(settingsContext);

		settingsView.appendChild(settingsRendered);

		function updateSettings() {
			return resource.get().then(function(shares) {
				settingsContext.shares = shares._items;
				settingsRendered.update();
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
		popupForm = ui.helpers.form({
			submitLabel: "Share",
			cancelLabel: "Cancel",

			onSubmit: function(values) {
				resource.enable(values.shortId);
				popupView.hide();
			},

			onCancel: function() {
				resource.remove(popupForm.getValues().shortId);
				popupView.hide();
			},

			fields: [
				{ type: "text", name: "description", label: "Shared item", value: "", readonly: true },
				{ type: "text", name: "url", label: "Share URL", value: "", readonly: true },
				{ type: "hidden", name: "shortId", value: "", readonly: true }
			]
		});


		popupRendered = popupTemplate.render({ form: popupForm });
		popupView.appendChild(popupRendered);

		popupView.undisplayed.add(function() {
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
			popupForm.setValues({
				description: description,
				url: "Generating URL..."
			});

			setTimeout(function() { popupView.resize(); }, 0);

			resource.add(provider, id, description)
			.then(function(share) {
				popupForm.setValues({
					description: description,
					url: share.url,
					shortId: share.shortId
				});

				popupView.resize();
			})
			.otherwise(function(err) {
				popupView.hide();
				ui.error("Cannot share resource", err.message);
			});
		}
	};
});