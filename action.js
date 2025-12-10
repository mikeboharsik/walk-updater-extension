(async function action() {
	function addToast(message, ms = 3000) {
		function removeToast() {
			const toast = document.querySelector('#walk-updater-toast');
			if (toast) {
				//toast.classList.remove('slide-up');
				//toast.classList.add('slide-down');
			}

			const style = document.querySelector('#walk-updater-style');
			if (style) {
				style.parentElement.removeChild(style);
			}

			if (toast) {
				toast.parentElement.removeChild(toast);
			}
		}

		removeToast();

		const style = document.createElement('style');
		style.id = 'walk-updater-style';
		style.textContent =
`@keyframes slide-up {
	0%: {
		bottom: -4em;
	}

	100%: {
		bottom: 0;
	}
}

@keyframes slide-down {
	0%: {
		bottom: 0;
	}

	100%: {
		bottom: -4em;
	}
}

.slide-up {
	animation: slide-up 1s linear 1;
}

.slide-down {
	animation: slide-down 1s linear 1;
}

#walk-updater-toast {
	align-items: center;
	background-color: white;
	border-radius: 0.3em;
	bottom: 0;
	color: black;
	display: flex;
	flex-direction: column;
	font-family: roboto;
	font-size: 3em;
	left: 50%;
	margin: 0;
	padding: 0.5em;
	pointer-events: auto;
	position: absolute;
	text-align: center;
	transform: translateX(-50%);
	z-index: 10000;
}

#walk-updater-toast-closeButton {
	margin-top: 1em;
	width: 4em;
}`;

		const messageBox = document.createElement('div');
		messageBox.id = 'walk-updater-toast';
		messageBox.textContent = message;

		const closeButton = document.createElement('button');
		closeButton.id = 'walk-updater-toast-closeButton';
		closeButton.innerHTML = 'Close';
		closeButton.onclick = () => {
			removeToast();
		};
		messageBox.appendChild(closeButton);

		document.head.appendChild(style);
		document.body.appendChild(messageBox);

		//messageBox.classList.add('slide-up');

		if (ms > 0) {
			setTimeout(() => {
				removeToast();
			}, ms);
		}
	}

	function triggerInputEvent(element) {
		const inputEvent = new Event('input', {
			bubbles: true,
			cancelable: true,
		});
		element.dispatchEvent(inputEvent);
	}

	const VIDEO_TYPE = {
		MERGED: 'MERGED',
		TRIMMED: 'TRIMMED',
		SHORT: 'SHORT',
		CLIP: 'CLIP',
	};

	if (!window.location.href.startsWith('https://studio.youtube.com')) return;

	const normalUrlPattern = /https:\/\/studio.youtube.com\/video\/(.*?)\/edit/;
	const uploadVideoLinkFullPattern = /https:\/\/youtube.com\/shorts\/(.*?)$/;
	const uploadVideoLinkBePattern = /https:\/\/youtu.be\/(.*?)$/;
	const mergedOrTrimmedPattern = /(\d{4}-\d{2}-\d{2})_(merged|trimmed).*.mp4/;
	const shortOrClipFilePattern = /(short|clip)(_\d{4}-\d{2}-\d{2})*_(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})/;
	const jumpToEventPattern = /https:\/\/2milesaday.com\/api\/jumpToEvent\?id=(.*)/;

	try {
		const originalFilename = (document.querySelector('#original-filename')?.textContent || '').trim();
		const description = document.querySelector('div[aria-label="Tell viewers about your video (type @ to mention a channel)"]');

		const textBoxes = document.querySelectorAll('#textbox');
		let videoId;
		let videoDate;
		let eventId;
		let videoType;

		const normalUrlMatches = window.location.href.match(normalUrlPattern);
		if (normalUrlMatches) {
			videoId = normalUrlMatches.at(1);
		}

		if (!videoId) {
			const videoInfos = document.querySelectorAll('.video-url-fadeable.style-scope.ytcp-video-info');
			const uploadVideoLinkFullMatches = videoInfos?.[0]?.textContent.trim().match(uploadVideoLinkFullPattern);
			if (uploadVideoLinkFullMatches) {
				videoId = uploadVideoLinkFullMatches?.[1];
			} else {
				const uploadVideoLinkBeMatches = videoInfos?.[0]?.textContent.trim().match(uploadVideoLinkBePattern);
				videoId = uploadVideoLinkBeMatches?.[1];
			}
		}

		const shortOrClipMatches = originalFilename.match(shortOrClipFilePattern);
		if (shortOrClipMatches) {
			const shortOrClip = shortOrClipMatches[1];
			eventId = shortOrClipMatches[3];
			switch (shortOrClip) {
				case 'short': {
					videoType = VIDEO_TYPE.SHORT;
					break;
				}
				case 'clip': {
					videoType = VIDEO_TYPE.CLIP;
					break;
				}
			}
		}

		if (!videoType) {
			const mergedOrTrimmedMatches = originalFilename.match(mergedOrTrimmedPattern);
			if (mergedOrTrimmedMatches) {
				videoDate = mergedOrTrimmedMatches[1];
				const mergedOrTrimmed = mergedOrTrimmedMatches[2];
				switch (mergedOrTrimmed) {
					case 'merged': {
						videoType = VIDEO_TYPE.MERGED;
						break;
					}
					case 'trimmed': {
						videoType = VIDEO_TYPE.TRIMMED;
						break;
					}
				}
			}
		}

		if (!videoType) {
			if (description) {
				const descriptionContent = description.textContent;
				const jumpToEventMatches = descriptionContent.match(jumpToEventPattern);
				if (jumpToEventMatches) {
					eventId = jumpToEventMatches[1];
					videoType = VIDEO_TYPE.SHORT;
				}
			}
		}

		const { gitCommit } = await browser.storage.local.get('gitCommit');

		switch (videoType) {
			case VIDEO_TYPE.MERGED: {
				textBoxes[0].textContent = videoDate;
				triggerInputEvent(textBoxes[0]);
				await fetch(`https://localhost/setWalkProperty?date=${videoDate}&key=privateYoutubeId&val=${videoId}`, { method: 'POST' });
				addToast('Updated merged video!', 3000);
				break;
			}
			case VIDEO_TYPE.TRIMMED: {
				const { title, description } = await fetch(`https://localhost/walkTitleAndDescription?date=${videoDate}`).then(res => res.json());
				textBoxes[0].textContent = title;
				triggerInputEvent(textBoxes[0]);
				textBoxes[1].textContent = description;		
				triggerInputEvent(textBoxes[1]);
				await fetch(`https://localhost/setWalkProperty?date=${videoDate}&key=youtubeId&val=${videoId}&commit=${gitCommit}`, { method: 'POST' });
				addToast('Updated trimmed video!', 3000);
				break;
			}
			case VIDEO_TYPE.SHORT: {
				const { title, description } = await fetch(`https://localhost/eventTitleAndDescription?eventId=${eventId}`).then(res => res.json());
				textBoxes[0].textContent = title;
				triggerInputEvent(textBoxes[0]);
				textBoxes[1].textContent = description;		
				triggerInputEvent(textBoxes[1]);
				await fetch(`https://localhost/setEventProperty?eventId=${eventId}&key=youtubeId&val=${videoId}&commit=${gitCommit}`, { method: 'POST' });
				addToast('Updated short!', 3000);
				break;
			}
			case VIDEO_TYPE.CLIP: {
				await fetch(`https://localhost/setEventProperty?eventId=${eventId}&key=youtubeId&val=${videoId}&commit=${gitCommit}`, { method: 'POST' });
				addToast('Updated clip!', 3000);
				break;
			}
			default: {
				addToast('Failed to detect video type', 0);
				break;
			}
		}
	} catch (e) {
		console.error(e);
		addToast(`Error: ${e.message}`, 0);
	}
}());