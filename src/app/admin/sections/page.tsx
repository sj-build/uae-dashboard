'use client'

import { useState, useCallback } from 'react'

interface SectionConfig {
  readonly id: string
  readonly name: string
  readonly dataFile: string
  readonly component: string
  readonly fields: readonly ConfigField[]
  readonly isExpanded?: boolean
}

interface ConfigField {
  readonly key: string
  readonly label: string
  readonly type: 'text' | 'number' | 'boolean' | 'select'
  readonly value: string | number | boolean
  readonly options?: readonly string[]
}

interface PageConfig {
  readonly id: string
  readonly label: string
  readonly sections: readonly SectionConfig[]
}

const PAGE_CONFIGS: readonly PageConfig[] = [
  {
    id: 'home',
    label: 'Home',
    sections: [
      {
        id: 'category-hot-issues',
        name: 'Category Hot Issues',
        dataFile: 'home/category-hot-issues.ts',
        component: 'CategoryHotIssues',
        fields: [
          { key: 'maxItems', label: 'Max Items', type: 'number', value: 6 },
          { key: 'showBadge', label: 'Show Badge', type: 'boolean', value: true },
        ],
      },
      {
        id: 'government-initiatives',
        name: 'Government Initiatives',
        dataFile: 'overview/initiatives.ts',
        component: 'GovernmentInitiatives',
        fields: [
          { key: 'defaultOpen', label: 'Default Open', type: 'boolean', value: false },
          { key: 'maxVisible', label: 'Max Visible', type: 'number', value: 5 },
        ],
      },
      {
        id: 'industry-hot-issues',
        name: 'Industry Hot Issues',
        dataFile: 'overview/hot-issues.ts',
        component: 'IndustryHotIssues',
        fields: [
          { key: 'defaultOpen', label: 'Default Open', type: 'boolean', value: false },
          { key: 'groupByCategory', label: 'Group by Category', type: 'boolean', value: true },
        ],
      },
      {
        id: 'news-headlines',
        name: 'News Headlines',
        dataFile: 'news/keywords.ts',
        component: 'NewsHeadlines',
        fields: [
          { key: 'maxHeadlines', label: 'Max Headlines', type: 'number', value: 10 },
          { key: 'refreshInterval', label: 'Refresh (min)', type: 'number', value: 30 },
        ],
      },
      {
        id: 'macro-risk-summary',
        name: 'Macro Risk Summary',
        dataFile: 'overview/macro-risks.ts',
        component: 'MacroRiskSummary',
        fields: [
          { key: 'showTrend', label: 'Show Trend', type: 'boolean', value: true },
          { key: 'riskThreshold', label: 'Risk Threshold', type: 'select', value: 'medium', options: ['low', 'medium', 'high'] },
        ],
      },
    ],
  },
  {
    id: 'comparison',
    label: 'UAE vs Korea',
    sections: [
      {
        id: 'stats-comparison',
        name: 'Statistics Comparison Table',
        dataFile: 'overview/comparison-stats.ts',
        component: 'StatsComparisonTable',
        fields: [
          { key: 'showChart', label: 'Show Chart', type: 'boolean', value: true },
          { key: 'highlightDiff', label: 'Highlight Differences', type: 'boolean', value: true },
        ],
      },
      {
        id: 'population-demographics',
        name: 'Population Demographics',
        dataFile: 'overview/population.ts',
        component: 'PopulationDemographics',
        fields: [
          { key: 'showPyramid', label: 'Show Pyramid', type: 'boolean', value: true },
          { key: 'compareMode', label: 'Compare Mode', type: 'select', value: 'side-by-side', options: ['side-by-side', 'overlay', 'stacked'] },
        ],
      },
      {
        id: 'bilateral-relations',
        name: 'Bilateral Relations',
        dataFile: 'overview/bilateral.ts',
        component: 'BilateralRelations',
        fields: [
          { key: 'showTimeline', label: 'Show Timeline', type: 'boolean', value: true },
          { key: 'yearsToShow', label: 'Years to Show', type: 'number', value: 10 },
        ],
      },
      {
        id: 'governance-concepts',
        name: 'Governance Concepts',
        dataFile: 'overview/governance.ts',
        component: 'GovernanceConcepts',
        fields: [
          { key: 'showIcons', label: 'Show Icons', type: 'boolean', value: true },
        ],
      },
      {
        id: 'must-know-differences',
        name: 'Must-Know Differences',
        dataFile: 'comparison/differences.ts',
        component: 'MustKnowDifferences',
        fields: [
          { key: 'maxItems', label: 'Max Items', type: 'number', value: 8 },
          { key: 'showCategory', label: 'Show Category', type: 'boolean', value: true },
        ],
      },
    ],
  },
  {
    id: 'politics',
    label: 'Politics',
    sections: [
      {
        id: 'political-system',
        name: 'Political System',
        dataFile: 'overview/emirates.ts',
        component: 'PoliticalSystem',
        fields: [
          { key: 'showDiagram', label: 'Show Diagram', type: 'boolean', value: true },
        ],
      },
      {
        id: 'emirates-cards',
        name: 'Emirates Cards',
        dataFile: 'overview/emirates.ts',
        component: 'EmiratesCards',
        fields: [
          { key: 'layout', label: 'Layout', type: 'select', value: 'grid', options: ['grid', 'list', 'carousel'] },
          { key: 'showStats', label: 'Show Stats', type: 'boolean', value: true },
        ],
      },
      {
        id: 'abu-dhabi-vs-dubai',
        name: 'Abu Dhabi vs Dubai',
        dataFile: 'overview/emirates.ts',
        component: 'AbuDhabiVsDubai',
        fields: [
          { key: 'highlightKey', label: 'Highlight Key Diff', type: 'boolean', value: true },
        ],
      },
      {
        id: 'government-structure',
        name: 'Government Structure',
        dataFile: 'overview/governance.ts',
        component: 'GovernmentStructure',
        fields: [
          { key: 'showHierarchy', label: 'Show Hierarchy', type: 'boolean', value: true },
          { key: 'interactive', label: 'Interactive', type: 'boolean', value: false },
        ],
      },
      {
        id: 'power-tiers',
        name: 'Power Structure Tiers',
        dataFile: 'power/tiers.ts',
        component: 'TierSection',
        fields: [
          { key: 'defaultOpen', label: 'Default Open', type: 'boolean', value: false },
          { key: 'showConnections', label: 'Show Connections', type: 'boolean', value: true },
        ],
      },
      {
        id: 'connection-tree',
        name: 'Connection Network',
        dataFile: 'connection/trees.ts',
        component: 'ConnectionTree',
        fields: [
          { key: 'defaultOpen', label: 'Default Open', type: 'boolean', value: false },
          { key: 'maxDepth', label: 'Max Depth', type: 'number', value: 3 },
        ],
      },
    ],
  },
  {
    id: 'economy',
    label: 'Economy',
    sections: [
      {
        id: 'economy-overview',
        name: 'Economy Overview',
        dataFile: 'overview/comparison-stats.ts',
        component: 'EconomyOverview',
        fields: [
          { key: 'showGDP', label: 'Show GDP', type: 'boolean', value: true },
          { key: 'showOilDependency', label: 'Show Oil Dependency', type: 'boolean', value: true },
        ],
      },
      {
        id: 'economy-structure',
        name: 'Economy Structure Detailed',
        dataFile: 'overview/comparison-stats.ts',
        component: 'EconomyStructureDetailed',
        fields: [
          { key: 'showBreakdown', label: 'Show Breakdown', type: 'boolean', value: true },
          { key: 'chartType', label: 'Chart Type', type: 'select', value: 'pie', options: ['pie', 'bar', 'treemap'] },
        ],
      },
      {
        id: 'economy-uniqueness',
        name: 'Economy Uniqueness',
        dataFile: 'overview/comparison-stats.ts',
        component: 'EconomyUniqueness',
        fields: [
          { key: 'showHighlights', label: 'Show Highlights', type: 'boolean', value: true },
        ],
      },
      {
        id: 'macro-risk',
        name: 'Macro Risk Summary',
        dataFile: 'overview/macro-risks.ts',
        component: 'MacroRiskSummary',
        fields: [
          { key: 'showTrend', label: 'Show Trend', type: 'boolean', value: true },
          { key: 'alertLevel', label: 'Alert Level', type: 'select', value: 'all', options: ['all', 'high', 'critical'] },
        ],
      },
    ],
  },
  {
    id: 'society',
    label: 'Society',
    sections: [
      {
        id: 'population-structure',
        name: 'Population Structure',
        dataFile: 'society/population.ts',
        component: 'PopulationStructure',
        fields: [
          { key: 'showNationality', label: 'Show Nationality', type: 'boolean', value: true },
          { key: 'showGender', label: 'Show Gender Split', type: 'boolean', value: true },
        ],
      },
      {
        id: 'business-culture',
        name: 'Business Culture',
        dataFile: 'society/business-culture.ts',
        component: 'BusinessCulture',
        fields: [
          { key: 'showTips', label: 'Show Tips', type: 'boolean', value: true },
          { key: 'showDosAndDonts', label: 'Show Dos & Donts', type: 'boolean', value: true },
        ],
      },
      {
        id: 'religion-section',
        name: 'Religion Section',
        dataFile: 'society/religion.ts',
        component: 'ReligionSection',
        fields: [
          { key: 'showCalendar', label: 'Show Calendar', type: 'boolean', value: true },
          { key: 'showPractices', label: 'Show Practices', type: 'boolean', value: true },
        ],
      },
      {
        id: 'essential-knowledge',
        name: 'Essential Knowledge',
        dataFile: 'society/essential-knowledge.ts',
        component: 'EssentialKnowledge',
        fields: [
          { key: 'maxItems', label: 'Max Items', type: 'number', value: 10 },
          { key: 'categorize', label: 'Categorize', type: 'boolean', value: true },
        ],
      },
      {
        id: 'recent-trends',
        name: 'Recent Trends',
        dataFile: 'society/trends.ts',
        component: 'RecentTrends',
        fields: [
          { key: 'showDate', label: 'Show Date', type: 'boolean', value: true },
          { key: 'sortBy', label: 'Sort By', type: 'select', value: 'date', options: ['date', 'importance', 'category'] },
        ],
      },
    ],
  },
  {
    id: 'industry',
    label: 'Industry',
    sections: [
      {
        id: 'economy-map',
        name: 'Economy Map (GDP Treemap)',
        dataFile: 'industry/gdp-sectors.ts',
        component: 'EconomyMap',
        fields: [
          { key: 'showKpiPanel', label: 'Show KPI Panel', type: 'boolean', value: true },
        ],
      },
      {
        id: 'cluster-grid',
        name: 'Industry Clusters',
        dataFile: 'industry/clusters.ts',
        component: 'ClusterGrid',
        fields: [
          { key: 'defaultOpenCount', label: 'Default Open Clusters', type: 'number', value: 2 },
          { key: 'showGdpBadges', label: 'Show GDP Badges', type: 'boolean', value: true },
          { key: 'expandable', label: 'Expandable Cards', type: 'boolean', value: true },
        ],
      },
    ],
  },
  {
    id: 'legal',
    label: 'Legal',
    sections: [
      {
        id: 'legal-framework',
        name: 'Legal Framework',
        dataFile: 'legal/legal-data.ts',
        component: 'LegalFramework',
        fields: [
          { key: 'showDiagram', label: 'Show Diagram', type: 'boolean', value: true },
          { key: 'showSources', label: 'Show Sources', type: 'boolean', value: false },
        ],
      },
      {
        id: 'business-regulations',
        name: 'Business Regulations',
        dataFile: 'legal/legal-data.ts',
        component: 'BusinessRegulations',
        fields: [
          { key: 'groupByType', label: 'Group by Type', type: 'boolean', value: true },
          { key: 'showRequirements', label: 'Show Requirements', type: 'boolean', value: true },
        ],
      },
      {
        id: 'free-zones',
        name: 'Free Zones',
        dataFile: 'legal/legal-data.ts',
        component: 'FreeZones',
        fields: [
          { key: 'showMap', label: 'Show Map', type: 'boolean', value: false },
          { key: 'sortBy', label: 'Sort By', type: 'select', value: 'name', options: ['name', 'emirate', 'popularity'] },
          { key: 'showBenefits', label: 'Show Benefits', type: 'boolean', value: true },
        ],
      },
      {
        id: 'recent-legal-changes',
        name: 'Recent Legal Changes',
        dataFile: 'legal/legal-data.ts',
        component: 'RecentLegalChanges',
        fields: [
          { key: 'showTimeline', label: 'Show Timeline', type: 'boolean', value: true },
          { key: 'yearsToShow', label: 'Years to Show', type: 'number', value: 3 },
        ],
      },
    ],
  },
] as const

interface CollapsibleSectionCardProps {
  readonly section: SectionConfig
  readonly isExpanded: boolean
  readonly onToggle: () => void
  readonly onFieldChange: (sectionId: string, fieldKey: string, value: string | number | boolean) => void
  readonly modifiedFields: Record<string, string | number | boolean>
}

function CollapsibleSectionCard({
  section,
  isExpanded,
  onToggle,
  onFieldChange,
  modifiedFields,
}: CollapsibleSectionCardProps) {
  return (
    <div className="bg-bg2 border border-brd rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg3/50 transition-colors duration-200"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
            <span className="text-xs font-mono text-gold">S</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-t1 truncate">{section.name}</div>
            <div className="text-[11px] text-t3 font-mono truncate">{section.dataFile}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-t4 bg-bg3 px-2 py-0.5 rounded hidden sm:inline">
            {section.component}
          </span>
          <span
            className={`text-t3 text-xs transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            &#9660;
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-brd px-5 py-4">
          <div className="mb-3">
            <span className="text-[11px] text-t3 font-medium uppercase tracking-wider">
              Configuration Fields
            </span>
          </div>
          <div className="space-y-3">
            {section.fields.map((field) => {
              const currentValue = modifiedFields[field.key] ?? field.value
              return (
                <div key={field.key} className="flex items-center gap-4">
                  <label className="text-xs text-t2 w-36 shrink-0">{field.label}</label>
                  {field.type === 'boolean' ? (
                    <button
                      onClick={() =>
                        onFieldChange(section.id, field.key, !currentValue)
                      }
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                        currentValue ? 'bg-gold/30' : 'bg-bg4'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${
                          currentValue
                            ? 'left-5 bg-gold'
                            : 'left-0.5 bg-t3'
                        }`}
                      />
                    </button>
                  ) : field.type === 'select' ? (
                    <select
                      value={String(currentValue)}
                      onChange={(e) =>
                        onFieldChange(section.id, field.key, e.target.value)
                      }
                      className="px-3 py-1.5 bg-bg3 border border-brd rounded-lg text-xs text-t1 focus:outline-none focus:border-gold/40"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={String(currentValue)}
                      onChange={(e) =>
                        onFieldChange(
                          section.id,
                          field.key,
                          field.type === 'number'
                            ? Number(e.target.value)
                            : e.target.value
                        )
                      }
                      className="px-3 py-1.5 bg-bg3 border border-brd rounded-lg text-xs text-t1 w-32 focus:outline-none focus:border-gold/40"
                    />
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-brd/50 flex items-center gap-2">
            <span className="text-[10px] text-t4">Component:</span>
            <code className="text-[10px] text-accent-blue bg-accent-blue/10 px-1.5 py-0.5 rounded">
              {'<'}{section.component}{' />'}
            </code>
          </div>
        </div>
      )}
    </div>
  )
}

function HelpSection() {
  return (
    <div className="mt-10 bg-bg2 border border-brd rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">?</span>
        <h3 className="text-sm font-semibold text-t1">Section Editor Help</h3>
      </div>
      <div className="space-y-4 text-xs text-t3">
        <div>
          <h4 className="text-t2 font-medium mb-1">Overview</h4>
          <p>
            This page allows you to configure the display settings for each section on the dashboard pages.
            Changes made here affect how components render their data.
          </p>
        </div>
        <div>
          <h4 className="text-t2 font-medium mb-1">How to Use</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Select a page tab to view its sections</li>
            <li>Click on a section card to expand its configuration</li>
            <li>Modify field values as needed</li>
            <li>Use &quot;Preview Changes&quot; to see a summary of modifications</li>
            <li>Use &quot;Export Code&quot; to generate configuration code</li>
          </ul>
        </div>
        <div>
          <h4 className="text-t2 font-medium mb-1">Data Files</h4>
          <p>
            Each section references a data file in <code className="text-gold bg-gold/10 px-1 rounded">src/data/</code>.
            To modify the actual content, edit these TypeScript files directly or use the Content Editor.
          </p>
        </div>
        <div>
          <h4 className="text-t2 font-medium mb-1">Note</h4>
          <p className="text-accent-orange">
            This is a demonstration interface. Actual configuration persistence will be implemented in Phase 3.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminSectionsPage() {
  const [activeTab, setActiveTab] = useState<string>('home')
  const [expandedSections, setExpandedSections] = useState<ReadonlySet<string>>(new Set())
  const [modifiedConfigs, setModifiedConfigs] = useState<
    Record<string, Record<string, string | number | boolean>>
  >({})

  const activePage = PAGE_CONFIGS.find((p) => p.id === activeTab)

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }, [])

  const handleFieldChange = useCallback(
    (sectionId: string, fieldKey: string, value: string | number | boolean) => {
      setModifiedConfigs((prev) => ({
        ...prev,
        [sectionId]: {
          ...(prev[sectionId] || {}),
          [fieldKey]: value,
        },
      }))
    },
    []
  )

  const handleExpandAll = useCallback(() => {
    if (activePage) {
      setExpandedSections(new Set(activePage.sections.map((s) => s.id)))
    }
  }, [activePage])

  const handleCollapseAll = useCallback(() => {
    setExpandedSections(new Set())
  }, [])

  const handlePreviewChanges = useCallback(() => {
    const changes = Object.entries(modifiedConfigs)
    if (changes.length === 0) {
      alert('No changes have been made yet.')
      return
    }

    const summary = changes
      .map(([sectionId, fields]) => {
        const fieldSummary = Object.entries(fields)
          .map(([key, val]) => `  - ${key}: ${val}`)
          .join('\n')
        return `[${sectionId}]\n${fieldSummary}`
      })
      .join('\n\n')

    alert(`Preview of Changes:\n\n${summary}\n\nNote: Persistence will be implemented in Phase 3.`)
  }, [modifiedConfigs])

  const handleExportCode = useCallback(() => {
    const changes = Object.entries(modifiedConfigs)
    if (changes.length === 0) {
      alert('No changes to export.')
      return
    }

    const codeSnippet = `// Generated Section Configuration
// Copy this to your configuration file

export const sectionConfigs = ${JSON.stringify(modifiedConfigs, null, 2)};
`

    alert(`Export Code:\n\n${codeSnippet}\n\nNote: Copy this configuration to apply changes.`)
  }, [modifiedConfigs])

  const totalModifications = Object.keys(modifiedConfigs).length

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-xl font-bold text-t1 tracking-wide">
          Section Editor
        </h1>
        <p className="text-t3 text-sm mt-1">
          Configure dashboard section display settings and component options
        </p>
      </div>

      <div className="flex flex-wrap gap-1 mb-6 bg-bg2 border border-brd rounded-lg p-1 w-fit">
        {PAGE_CONFIGS.map((page) => (
          <button
            key={page.id}
            onClick={() => setActiveTab(page.id)}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
              activeTab === page.id
                ? 'bg-gold/15 text-gold border border-gold/25'
                : 'text-t3 hover:text-t2 hover:bg-bg3 border border-transparent'
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={handleExpandAll}
          className="px-3 py-1.5 text-[11px] font-medium text-t2 hover:text-t1 bg-bg3 hover:bg-bg4 border border-brd rounded-md transition-all duration-200"
        >
          Expand All
        </button>
        <button
          onClick={handleCollapseAll}
          className="px-3 py-1.5 text-[11px] font-medium text-t2 hover:text-t1 bg-bg3 hover:bg-bg4 border border-brd rounded-md transition-all duration-200"
        >
          Collapse All
        </button>
        <div className="h-4 w-px bg-brd hidden sm:block" />
        <button
          onClick={handlePreviewChanges}
          className="px-4 py-1.5 text-[11px] font-semibold text-accent-blue hover:text-white bg-accent-blue/10 hover:bg-accent-blue/80 border border-accent-blue/20 hover:border-accent-blue rounded-md transition-all duration-200"
        >
          Preview Changes
          {totalModifications > 0 && (
            <span className="ml-1.5 bg-accent-blue/30 text-accent-blue px-1.5 py-0.5 rounded text-[10px]">
              {totalModifications}
            </span>
          )}
        </button>
        <button
          onClick={handleExportCode}
          className="px-4 py-1.5 text-[11px] font-semibold text-gold hover:text-white bg-gold/10 hover:bg-gold/80 border border-gold/20 hover:border-gold rounded-md transition-all duration-200"
        >
          Export Code
        </button>
      </div>

      {activePage && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-t2">
              {activePage.label} Sections
              <span className="ml-2 text-t4 font-normal">
                ({activePage.sections.length} sections)
              </span>
            </h2>
          </div>
          {activePage.sections.map((section) => (
            <CollapsibleSectionCard
              key={section.id}
              section={section}
              isExpanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
              onFieldChange={handleFieldChange}
              modifiedFields={modifiedConfigs[section.id] || {}}
            />
          ))}
        </div>
      )}

      <HelpSection />
    </div>
  )
}
