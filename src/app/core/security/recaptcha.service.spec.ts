import { recaptchaScriptAllowed } from './recaptcha.service';

describe('recaptcha script urls', () => {
  it('allows the Google script hosts and rejects anything else', () => {
    expect(
      recaptchaScriptAllowed('https://www.google.com/recaptcha/api.js?render=site-key'),
    ).toBe(true);
    expect(
      recaptchaScriptAllowed('https://www.gstatic.com/recaptcha/releases/v/recaptcha__es.js'),
    ).toBe(true);
    expect(recaptchaScriptAllowed('https://www.google.com/recaptcha/api2/webworker.js')).toBe(
      true,
    );
    expect(recaptchaScriptAllowed('https://evil.google.com/recaptcha/api.js')).toBe(false);
    expect(recaptchaScriptAllowed('https://www.google.com/maps/api.js')).toBe(false);
    expect(recaptchaScriptAllowed('http://www.google.com/recaptcha/api.js')).toBe(false);
    expect(recaptchaScriptAllowed('javascript:alert(1)')).toBe(false);
  });
});
