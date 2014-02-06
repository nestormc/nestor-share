/*jshint browser:true */
/*global define */

define(["rest"], function(rest) {
	"use strict";

	return {
		get: function() {
			return rest.get("shares", { limit: 0 });
		},

		add: function(provider, resource, description, enabled) {
			return rest.post("shares", { description: description, provider: provider, resource: resource, disabled: !enabled });
		},

		remove: function(key) {
			return rest.del("shares/" + key);
		},

		enable: function(key) {
			return rest.patch("shares/" + key, { disabled: false });
		},

		disable: function(key) {
			return rest.patch("shares/" + key, { disabled: true });
		}
	};
});