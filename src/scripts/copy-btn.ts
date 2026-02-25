export {};

document.querySelectorAll<HTMLButtonElement>('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const text = btn.dataset.copy;
        if (!text) return;
        void navigator.clipboard
            .writeText(text)
            .then(() => {
                const original = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => {
                    btn.textContent = original;
                }, 1500);
            })
            .catch(() => {
                const code = btn.previousElementSibling;
                if (code) {
                    const range = document.createRange();
                    range.selectNodeContents(code);
                    const sel = window.getSelection();
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                }
            });
    });
});
