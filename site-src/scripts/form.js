(() => {
  const form = document.querySelector('[data-demo-form]');
  if (!form) return;

  const intent = form.querySelector('[name="intent"]');
  const acknowledgement = form.querySelector('[name="demoAck"]');
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('[type="submit"]');
  const fields = [intent, acknowledgement];

  if (!intent || !acknowledgement || !status || !submit) return;

  function setFieldError(field, errorKey, hasError) {
    const error = form.querySelector(`[data-error-for="${errorKey}"]`);
    field.setAttribute('aria-invalid', String(hasError));
    if (error) error.hidden = !hasError;
    return hasError;
  }

  function clearStatus() {
    status.textContent = '';
    status.removeAttribute('data-state');
  }

  function validate() {
    const intentError = setFieldError(intent, 'intent', intent.value === '');
    const acknowledgementError = setFieldError(acknowledgement, 'ack', !acknowledgement.checked);
    if (intentError) intent.focus();
    else if (acknowledgementError) acknowledgement.focus();
    return !intentError && !acknowledgementError;
  }

  fields.forEach((field) => {
    field.addEventListener('input', clearStatus);
    field.addEventListener('change', () => {
      clearStatus();
      if (field === intent && field.value) setFieldError(field, 'intent', false);
      if (field === acknowledgement && field.checked) setFieldError(field, 'ack', false);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearStatus();

    try {
      if (!validate()) {
        status.textContent = form.dataset.validationError;
        status.dataset.state = 'error';
        return;
      }

      form.reset();
      fields.forEach((field) => {
        field.removeAttribute('aria-invalid');
        setFieldError(field, field === intent ? 'intent' : 'ack', false);
      });
      status.textContent = form.dataset.success;
      status.dataset.state = 'success';
    } catch {
      status.textContent = form.dataset.error;
      status.dataset.state = 'error';
    }
  });

  fields.forEach((field) => { field.disabled = false; });
  submit.disabled = false;
})();
