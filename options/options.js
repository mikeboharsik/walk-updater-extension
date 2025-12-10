(async function main() {
	const gitCommitCheckbox = document.querySelector('#gitCommit');
	let { gitCommit: value } = await browser.storage.local.get('gitCommit');
	if (value !== true && value !== false) {
		value = true;
		await browser.storage.local.set({ gitCommit: value });
	}
	
	if (value === true) {
		gitCommitCheckbox.checked = true;
	}

	gitCommitCheckbox.onchange = async (e) => {
		await browser.storage.local.set({ gitCommit: e.target.checked });
	};
})();