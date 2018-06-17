// A declarative suite of functions for writing markdown
// Call these components if you like

const Heading = (text, level = 1) => `${"#".repeat(level)} ${text}\n`;

const h1 = text => Heading(text, 1);
const h2 = text => Heading(text, 2);
const h3 = text => Heading(text, 3);
const h4 = text => Heading(text, 4);

const Image = (url, description = "") => `!${Link(url, description)}`;
const Link = (url, description = "") => `[${description}](${url})`;
const Gallery = (images = []) => images.join("\n\n");
const P = text => text;
const Markdown = (...children) => children.join("\n\n");

module.exports = {
  h1,
  h2,
  h3,
  h4,
  Heading,
  Image,
  Gallery,
  Link,
  P,
  Markdown
};
