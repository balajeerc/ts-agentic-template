/**
 * Dependency rules for this project.
 *
 * Section 1 is project-agnostic dependency health and should survive into any
 * project unchanged. Section 2 is where module-boundary rules go — the ones
 * that encode THIS project's architecture (feature isolation, layering,
 * "pure module must not import the runtime", …). It ships with one worked
 * example, commented out; delete it or replace it with your own.
 *
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    // ============================================
    // SECTION 1: Core Dependency Health Rules
    // ============================================
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'This dependency is part of a circular relationship. You might want to revise ' +
        'your solution (i.e. use dependency injection, or move shared logic to a sub module).',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment:
        'This file is not imported by any other file. Consider removing it if unused, ' +
        "or adding it to an index file if it's meant to be exported.",
      from: {
        orphan: true,
        pathNot: [
          // Entry points are expected to be orphans
          '^src/index\\.ts$',
          // Test files
          '\\.test\\.ts$',
          '\\.spec\\.ts$',
          // Config files
          '\\.config\\.(ts|js|cjs|mjs)$',
        ],
      },
      to: {},
    },
    {
      name: 'no-deprecated',
      severity: 'warn',
      comment:
        'This module depends on a deprecated module. Consider updating to use the current alternative.',
      from: {},
      to: {
        dependencyTypes: ['deprecated'],
      },
    },
    {
      name: 'no-duplicate-dep-types',
      severity: 'warn',
      comment:
        'This module has the same dependency listed in multiple dependency types (e.g., both ' +
        'dependencies and devDependencies in package.json).',
      from: {},
      to: {
        moreThanOneDependencyType: true,
      },
    },

    // ============================================
    // SECTION 2: Module Boundary Rules (project-specific)
    // ============================================
    //
    // Worked example — a `src/shared/` that must stay generic. Uncomment and
    // adapt, or replace with the boundaries your project actually has.
    //
    // {
    //   name: 'no-shared-import-features',
    //   severity: 'error',
    //   comment:
    //     'Shared code should not import from feature folders. Shared code should be truly ' +
    //     'generic and not depend on any specific feature implementation.',
    //   from: { path: '^src/shared/' },
    //   to: { path: '^src/features/' },
    // },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
