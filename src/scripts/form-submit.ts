interface FormSubmitOptions {
    formId: string;
    submitId: string;
    statusId: string;
    action: string;
    successMessage: string;
}

export function initFormSubmit({
    formId,
    submitId,
    statusId,
    action,
    successMessage,
}: FormSubmitOptions): void {
    const form = document.getElementById(formId);
    const submitButton = document.getElementById(submitId);
    const statusNode = document.getElementById(statusId);

    if (!form) return;

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!submitButton || !statusNode) return;

        statusNode.textContent = 'Sending...';
        submitButton.setAttribute('disabled', 'true');
        submitButton.classList.add('opacity-70');

        const formData = new FormData(form as HTMLFormElement);
        fetch(action, { method: 'POST', body: formData })
            .then(async (response) => {
                const result: { error?: string } = await response.json();
                if (!response.ok) {
                    statusNode.textContent =
                        result.error ?? 'Something went wrong.';
                    statusNode.className = 'min-h-5 text-sm text-red-300';
                    return;
                }
                statusNode.textContent = successMessage;
                statusNode.className = 'min-h-5 text-sm text-neon-green';
                (form as HTMLFormElement).reset();
            })
            .catch(() => {
                statusNode.textContent = 'Network issue. Try again.';
                statusNode.className = 'min-h-5 text-sm text-red-300';
            })
            .finally(() => {
                submitButton.removeAttribute('disabled');
                submitButton.classList.remove('opacity-70');
            });
    });
}
