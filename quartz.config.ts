import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Deník Markeťáka",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {},
    locale: "cs-CZ",
    baseUrl: "denikmarketaka.com",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
      header: "Lora",
      body: "Lora",
      code: "JetBrains Mono",
      },
      colors: {
        lightMode: {
          light: "#faf6f1",
          lightgray: "#e8e1d4",
          gray: "#9c8f7d",
          darkgray: "#3d3733",
          dark: "#2a2520",
          secondary: "#8b3a2f",
          tertiary: "#b87333",
          highlight: "rgba(184, 115, 51, 0.1)",
          textHighlight: "#f7e6c488",
        },
        darkMode: {
          light: "#1a1614",
          lightgray: "#3a342e",
          gray: "#7a6f60",
          darkgray: "#d4c9b6",
          dark: "#e8dcc8",
          secondary: "#c87a5f",
          tertiary: "#d4a574",
          highlight: "rgba(212, 165, 116, 0.1)",
          textHighlight: "#8b6f3d88",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
