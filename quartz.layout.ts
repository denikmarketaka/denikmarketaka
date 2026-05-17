import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// ============================================================
// SHARED (footer atd.) - tohle je společný pro všechny varianty
// ============================================================
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.CustomFooter(),
}

// ============================================================
// PŘEPÍNAČ - tady volíš variantu
// Možnosti: "minimal" | "medium" | "full"
// ============================================================
const VARIANTA: "minimal" | "medium" | "full" = "medium"

// ============================================================
// VARIANTA 1: MINIMAL
// Vlevo: title + search + darkmode
// Vpravo: nic
// ============================================================
const minimalContentLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        { Component: Component.Search(), grow: true },
        { Component: Component.Darkmode() },
      ],
    }),
  ],
  right: [],
}

const minimalListLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: minimalContentLayout.left,
  right: [],
}

// ============================================================
// VARIANTA 2: MEDIUM
// Vlevo: title + search + darkmode + Explorer (seznam postů)
// Vpravo: Table of Contents (sekce v rámci postu)
// ============================================================
const mediumContentLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        { Component: Component.Search(), grow: true },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer(),
  ],
  right: [
    Component.DesktopOnly(Component.TableOfContents()),
  ],
}

const mediumListLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: mediumContentLayout.left,
  right: [],
}

// ============================================================
// VARIANTA 3: FULL (default Quartz)
// Vše - Explorer, Graph, ToC, Backlinks
// ============================================================
const fullContentLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        { Component: Component.Search(), grow: true },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer(),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

const fullListLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: fullContentLayout.left,
  right: [],
}

// ============================================================
// VÝBĚR - tohle pak Quartz použije
// ============================================================
const layouts = {
  minimal: { content: minimalContentLayout, list: minimalListLayout },
  medium: { content: mediumContentLayout, list: mediumListLayout },
  full: { content: fullContentLayout, list: fullListLayout },
}

export const defaultContentPageLayout: PageLayout = layouts[VARIANTA].content
export const defaultListPageLayout: PageLayout = layouts[VARIANTA].list