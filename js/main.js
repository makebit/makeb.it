/*
 * Makebit - makeb.it
 * Plain vanilla JS (no jQuery).
 */

// Language (it / en): saved preference first, then browser, defaulting to 'en'.
var SAVED_LOCALE = null;
try { SAVED_LOCALE = localStorage.getItem('locale'); } catch (e) { /* storage unavailable */ }
var LOCALE = (SAVED_LOCALE === 'it' || SAVED_LOCALE === 'en')
	? SAVED_LOCALE
	: (((navigator.language || navigator.userLanguage || 'en').toLowerCase().indexOf('it') === 0) ? 'it' : 'en');

// Contact form delivery service (no backend needed on our side).
var FORM_ENDPOINT = 'https://formsubmit.co/ajax/makebitcake@gmail.com';

function localize() {
	document.documentElement.lang = LOCALE;

	// <l en="..." it="..."> elements -> inner HTML
	document.querySelectorAll('l').forEach(function (el) {
		var value = el.getAttribute(LOCALE);
		if (value !== null) {
			el.innerHTML = value;
		}
	});

	// Inputs / textareas -> placeholder
	document.querySelectorAll('input[' + LOCALE + '], textarea[' + LOCALE + ']').forEach(function (el) {
		var value = el.getAttribute(LOCALE);
		if (value !== null) {
			el.placeholder = value;
		}
	});
}

document.addEventListener('DOMContentLoaded', function () {
	localize();

	// --- Language switcher (EN / IT) ---
	var langButtons = document.querySelectorAll('.lang-btn');

	function updateLangButtons() {
		langButtons.forEach(function (btn) {
			var active = btn.getAttribute('data-lang') === LOCALE;
			btn.classList.toggle('active', active);
			btn.setAttribute('aria-pressed', active ? 'true' : 'false');
		});
	}

	langButtons.forEach(function (btn) {
		btn.addEventListener('click', function () {
			var lang = btn.getAttribute('data-lang');
			if (lang === LOCALE) { return; }
			LOCALE = lang;
			try { localStorage.setItem('locale', LOCALE); } catch (e) { /* storage unavailable */ }
			localize();
			updateLangButtons();
		});
	});

	updateLangButtons();

	var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// --- Navbar: mobile toggle + shadow on scroll ---
	var navbar = document.getElementById('navbar');
	var navToggle = document.getElementById('nav-toggle');
	var navLinks = document.getElementById('nav-links');

	if (navToggle && navLinks) {
		navToggle.addEventListener('click', function () {
			var open = navLinks.classList.toggle('open');
			navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
		});

		// Close the mobile menu after a link is tapped.
		navLinks.querySelectorAll('a').forEach(function (a) {
			a.addEventListener('click', function () {
				navLinks.classList.remove('open');
				navToggle.setAttribute('aria-expanded', 'false');
			});
		});
	}

	// --- Active section highlight in the navbar ---
	var sectionLinks = [];
	if (navLinks) {
		navLinks.querySelectorAll('a[href^="#"]').forEach(function (a) {
			var target = document.getElementById(a.getAttribute('href').slice(1));
			if (target) {
				sectionLinks.push({ link: a, section: target });
			}
		});
	}

	function updateActiveLink() {
		var y = window.scrollY || window.pageYOffset;
		var current = null;
		sectionLinks.forEach(function (item) {
			if (item.section.offsetTop - 120 <= y) {
				current = item;
			}
		});
		sectionLinks.forEach(function (item) {
			item.link.classList.toggle('active', item === current);
		});
	}

	// --- Back to top button ---
	var toTop = document.getElementById('to-top');

	function onScroll() {
		var y = window.scrollY || window.pageYOffset;
		if (navbar) {
			navbar.classList.toggle('scrolled', y > 8);
		}
		if (toTop) {
			toTop.style.display = y > 400 ? 'flex' : 'none';
		}
		updateActiveLink();
	}

	window.addEventListener('scroll', onScroll);
	onScroll();

	// --- Reveal on scroll ---
	var revealEls = document.querySelectorAll('.reveal');
	if ('IntersectionObserver' in window && !reducedMotion) {
		var revealObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('in');
					revealObserver.unobserve(entry.target);
				}
			});
		}, { threshold: 0.12 });

		revealEls.forEach(function (el) {
			revealObserver.observe(el);
		});
	} else {
		revealEls.forEach(function (el) {
			el.classList.add('in');
		});
	}

	// --- Animated stat counters ---
	function animateCounter(el) {
		var target = parseInt(el.getAttribute('data-target'), 10);
		var suffix = el.getAttribute('data-suffix') || '';
		var duration = 1200;
		var start = null;

		function step(ts) {
			if (start === null) {
				start = ts;
			}
			var progress = Math.min((ts - start) / duration, 1);
			// ease-out
			var eased = 1 - Math.pow(1 - progress, 3);
			el.textContent = Math.round(eased * target) + suffix;
			if (progress < 1) {
				requestAnimationFrame(step);
			}
		}

		requestAnimationFrame(step);
	}

	var counters = document.querySelectorAll('.stat__num[data-target]');
	if ('IntersectionObserver' in window && !reducedMotion) {
		var counterObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					animateCounter(entry.target);
					counterObserver.unobserve(entry.target);
				}
			});
		}, { threshold: 0.5 });

		counters.forEach(function (el) {
			counterObserver.observe(el);
		});
	}

	// --- Contact form: send through FormSubmit (AJAX) ---
	var sendButton = document.getElementById('send-mail');
	if (sendButton) {
		sendButton.addEventListener('click', function () {
			var nameEl = document.getElementById('name');
			var emailEl = document.getElementById('email');
			var subjectEl = document.getElementById('subject');
			var messageEl = document.getElementById('message');
			var success = document.getElementById('mail-success');
			var error = document.getElementById('mail-error');
			var errorNet = document.getElementById('mail-error-net');

			var name = nameEl ? nameEl.value.trim() : '';
			var email = emailEl ? emailEl.value.trim() : '';
			var subject = subjectEl ? subjectEl.value.trim() : '';
			var message = messageEl ? messageEl.value.trim() : '';

			function show(el) {
				[success, error, errorNet].forEach(function (a) {
					if (a) { a.style.display = (a === el) ? 'block' : 'none'; }
				});
			}

			if (!email || !subject || !message) {
				show(error);
				return;
			}

			var originalHTML = sendButton.innerHTML;
			sendButton.disabled = true;
			sendButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

			fetch(FORM_ENDPOINT, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify({
					name: name,
					email: email,
					_subject: '[makeb.it] ' + subject,
					message: message
				})
			}).then(function (res) {
				if (!res.ok) {
					throw new Error('HTTP ' + res.status);
				}
				return res.json();
			}).then(function () {
				show(success);
				var form = document.getElementById('form-mail');
				if (form) { form.reset(); }
			}).catch(function () {
				show(errorNet);
			}).finally(function () {
				sendButton.disabled = false;
				sendButton.innerHTML = originalHTML;
			});
		});
	}
});
