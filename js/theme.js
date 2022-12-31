/* global CONFIG */

(function () {
  const theme = window.localStorage.getItem('theme');
  const dataTheme = theme === 'dark' ? 'dark' : 'light';
  const themeToggleBtn = document.querySelector('.theme-toggle');

  document.querySelector('html').setAttribute('data-theme', dataTheme);
  themeToggleBtn.innerHTML = `
    <img src="${CONFIG.root}images/${theme}.svg" />
  `;

  themeToggleBtn.addEventListener('click', () => {
    const theme = window.localStorage.getItem('theme');

    if (theme === 'dark') {
      window.localStorage.setItem('theme', 'light');
      themeToggleBtn.innerHTML = `
      <img src="${CONFIG.root}images/light.svg"' />
    `;

      document.querySelector('html').setAttribute('data-theme', 'light');
    } else {
      window.localStorage.setItem('theme', 'dark');
      themeToggleBtn.innerHTML = `
      <img src="${CONFIG.root}images/dark.svg"' />
    `;

      document.querySelector('html').setAttribute('data-theme', 'dark');
    }
  });
})();
