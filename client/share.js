/*jshint browser:true */
/*global define */

define(
["ui", "router", "resource", "ist!templates/settings"],
function(ui, router, resource, settingsTemplate) {
	"use strict";


	/*!
	 * Fill views when UI starts
	 */

	var popupView;
	var popupForm;


	ui.started.add(function() {
		if (!ui.hasRight("nestor:shares")) {
			return;
		}

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
			title: "Share resource",

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

		popupView.appendChild(popupForm);
	});


	/*!
	 * Plugin manifest
	 */

	return {
		views: {
			"share-settings": {
				ifRight: "nestor:shares",
				type: "settings",
				title: "Shares",
				description: "Manage shared resources",
				icon: "share"
			},

			"new-share": {
				ifRight: "nestor:shares",
				type: "popup"
			}
		},

		public: function shareResource(provider, id, description) {
			if (!ui.hasRight("nestor:shares")) {
				return;
			}

			popupView.show();
			popupForm.setValues({
				description: description,
				url: "Generating URL..."
			});

			popupView.resize();

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