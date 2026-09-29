import type { Dict } from '../types';
import { en } from './en';

// Norwegian Bokmål (Norsk). This file follows the partial-coverage pattern
// the other non-tier-1 locales use: every key comes from the English
// dictionary through the `...en` spread, and the explicit overrides below
// carry the Norwegian copy for the visible surfaces. Every override keeps
// the `{placeholders}` of its English source so the locale parity test holds.
export const no: Dict = {
  ...en,

  // ── Brand / shell ────────────────────────────────────────────────
  'app.brandSubtitle': 'fra Nexu Labs',

  // ── Common actions ───────────────────────────────────────────────
  'common.cancel': 'Avbryt',
  'common.save': 'Lagre',
  'common.close': 'Lukk',
  'common.clear': 'Tøm',
  'common.delete': 'Slett',
  'common.rename': 'Gi nytt navn',
  'common.edit': 'Rediger',
  'common.preview': 'Forhåndsvisning',
  'common.share': 'Del',
  'common.search': 'Søk',
  'common.searchEllipsis': 'Søk…',
  'common.loading': 'Laster…',
  'common.all': 'Alle',
  'common.none': 'Ingen',
  'common.default': 'Standard',
  'common.installed': 'installert',
  'common.notInstalled': 'ikke installert',
  'common.active': 'aktiv',
  'common.inactive': 'inaktiv',
  'common.offline': 'offline',
  'common.selected': 'valgt',
  'common.create': 'Opprett',
  'common.openPreview': 'Åpne forhåndsvisning',
  'common.exitFullscreen': 'Avslutt fullskjerm',
  'common.fullscreen': 'Fullskjerm',
  'common.openInNewTab': 'Åpne i ny fane',
  'common.exportPdf': 'Eksporter til PDF',
  'common.exportZip': 'Last ned som .zip',
  'common.exportHtml': 'Eksporter som HTML',
  'common.exportImage': 'Eksporter som bilde',
  'common.exportImageFailed':
    'Kunne ikke ta bilde. Prøv igjen eller bruk skjermbildeverktøyet i nettleseren.',
  'common.justNow': 'akkurat nå',
  'common.minutesAgo': '{n} min siden',
  'common.hoursAgo': '{n} t siden',
  'common.daysAgo': '{n} d siden',
  'common.weeksAgo': '{n} uker siden',
  'common.now': 'nå',
  'common.minutesShort': '{n}m',
  'common.hoursShort': '{n}t',
  'common.daysShort': '{n}d',
  'common.untitled': 'Uten navn',

  // ── Billing / credits ────────────────────────────────────────────
  'billing.wallet': 'Lommebok',
  'entry.credits': 'Kvote',
  'settings.amrBalance': 'Kvote',

  // ── Chat: plan / balance gates ───────────────────────────────────
  'chat.amrError.authMessage':
    'SplatStudio Cloud-kontoen din er ikke autorisert ennå. Autoriser den, og denne kjøringen prøves automatisk på nytt.',
  'chat.amrError.balanceMessage':
    'SplatStudio Cloud-saldoen er brukt opp. Fyll på for å fortsette denne kjøringen.',
  'chat.amrError.authorizeCta': 'Autoriser og prøv igjen',
  'chat.amrError.rechargeCta': 'Fyll på',
  'chat.amrBalanceGate.title': 'Oppgrader planen og fortsett å skape',
  'chat.amrBalanceGate.message':
    'Ikke nok kreditter ({balance} igjen). Oppgrader eller fyll på, så starter oppgaven med en gang.',
  'chat.amrBalanceGate.benefitsTitle': 'Dette gir SplatStudio Cloud',
  'chat.amrBalanceGate.benefit1': 'Ingen API-nøkler – stort utvalg av modeller',
  'chat.amrBalanceGate.benefit2': 'Innebygd SOTA-agent for design, uten oppsett',
  'chat.amrBalanceGate.benefit3': 'Offisiell tjeneste – pålitelig',
  'chat.amrBalanceGate.benefit4': 'Utvikles kontinuerlig: ett-klikks distribusjon, multimodalt, team og mer',
  'chat.amrBalanceGate.laterCta': 'Ikke nå',
  'chat.amrBalanceGate.plansCta': 'Oppgrader planen',
  'chat.amrBalanceGate.signedOutTitle': 'Logg inn for å komme i gang',
  'chat.amrBalanceGate.signedOutMessage':
    'Du bruker SplatStudio Cloud-agenten – logg inn, så starter denne oppgaven med en gang.',
  'chat.amrBalanceGate.signInCta': 'Logg inn',
  'chat.amrBalanceGate.watchingWallet': 'Vi fortsetter automatisk så snart saldoen er oppdatert.',

  // ── Chat: run errors ─────────────────────────────────────────────
  'chat.connectionDropped': 'Sjekk at nettverksforbindelsen virker, og prøv igjen.',
  'chat.runError.title.authRequired': 'Innlogging kreves',
  'chat.runError.title.balance': 'Utilstrekkelig saldo',
  'chat.runError.title.connectionDropped': 'Nettverksforbindelsen ble brutt',
  'chat.runError.title.signInRequired.other': 'Ikke logget inn på {agent}',
  'chat.runError.title.rateLimited': 'Modelltjenesten er overbelastet',
  'chat.runError.title.modelWindowLimit': 'Høy belastning',
  'chat.runError.title.membershipConcurrencyLimit': 'Grensen for samtidige oppgaver er nådd',
  'chat.runError.title.generic': 'Kunne ikke fullføre oppgaven',
  'chat.runError.title.agentReplyIncomplete': 'Agenten fullførte ikke svaret',
  'chat.runError.agentReplyIncompleteMessage':
    'Denne oppgaven kunne ikke fullføres. Prøv igjen – og kontakt support hvis det gjentar seg.',
  'chat.runError.title.clarificationRepeated': 'Agenten spurte om mer informasjon',
  'chat.runError.clarificationRepeatedMessage':
    'Agenten ba om mer informasjon en gang til, men en oppgave har bare én runde med spørsmål, så den stoppet der. Svarene dine ligger i samtalen – prøv igjen, og ta med detaljene med en gang.',
  'chat.runError.title.cliMissing': '{agent} ble ikke funnet',
  'chat.runError.title.promptTooLarge': 'Samtalen er for lang',
  'chat.runError.title.upstreamUnavailable': 'Modelltjenesten er utilgjengelig',
  'chat.runError.title.cliSessionRefused': 'Inkompatibel agentversjon',
  'chat.runError.cliSessionRefusedMessage':
    'SplatStudio støtter ikke denne agentversjonen ennå. Bytt til en støttet versjon og prøv igjen.',
  'chat.runError.cliMissingMessage':
    'Sjekk at {agent} er installert på denne maskinen, og prøv igjen.',
  'chat.runError.promptTooLargeMessage':
    'Den nåværende konteksten er lengre enn modellen kan håndtere. Start en ny samtale og prøv igjen.',
  'chat.runError.upstreamUnavailableMessage':
    'Den valgte modellen er midlertidig utilgjengelig. Prøv igjen senere, eller bytt modell.',
  'chat.runError.signInMessage.amr':
    'Logg inn for å se prosjektene dine og fortsette samtalen.',
  'chat.runError.signInMessage.other': 'Logg inn på {agent} først, og prøv igjen.',
  'chat.runError.agentFallback': 'agent',
  'chat.runError.sourceLabel': 'Feildetaljer',
  'chat.runError.sourceExpandAria': 'Vis feilkilden',
  'chat.runError.sourceCollapseAria': 'Skjul feilkilden',
  'chat.runError.clientEnvironmentMessage':
    'Forespørselen ser ut til å ha gått gjennom en proxy eller bedriftsnettverk, og {agent} avviste den ({cause}). Bytt nettverksutgang eller konfigurer proxy i Innstillinger.',
  'chat.runError.clientEnvironmentCause.certificate': 'sertifikatet kunne ikke bekreftes',
  'chat.runError.clientEnvironmentCause.proxy': 'problem med proxy-oppsettet',
  'chat.runError.clientEnvironmentCause.network': 'nettverket er utilgjengelig',
  'chat.runError.clientEnvironmentCause.hostPolicy': 'blokkert av systempolicy',

  // ── Chat: composer ───────────────────────────────────────────────
  'chat.selectFromLibrary': 'Importer fra biblioteket',
  'chat.importFigma': 'Importer fra Figma',
  'chat.plus.group.files': 'Filer',
  'chat.plus.group.code': 'Kode',
  'chat.plus.group.designs': 'Design',
  'chat.plus.group.other': 'Annet',
  'chat.plus.attachFiles': 'Legg ved filer',
  'chat.plus.referenceProject': 'Legg til et annet prosjekt som referanse',
  'chat.plus.linkLocalCode': 'Koble til lokal kode',
  'chat.plus.uploadFig': 'Last opp .fig',
  'chat.plus.learnHow': 'Slik fungerer det',
  'chat.plus.designSystem': 'Designsystem',
  'chat.plus.skills': 'Ferdigheter',
  'chat.plus.noSkills': 'Ingen ferdigheter tilgjengelig',
  'chat.plus.connectors': 'Koblinger',
  'chat.plus.plugins': 'Programtillegg',

  // ── Design browser ───────────────────────────────────────────────
  'designBrowser.viewport.desktop': 'Skrivebord',
  'designBrowser.viewport.desktopTitle': 'Bruk full størrelse på nettleserfanen',
  'designBrowser.viewport.tablet': 'Nettbrett',
  'designBrowser.viewport.tabletTitle': 'Forhåndsvisning i 820 px bredde',
  'designBrowser.viewport.mobile': 'Mobil',
  'designBrowser.viewport.mobileTitle': 'Forhåndsvisning i 390 px bredde',
  'designBrowser.menu': 'Nettlesermeny',
  'designBrowser.copyScreenshot': 'Kopier skjermbilde',
  'designBrowser.hardReload': 'Hard oppdatering',
  'designBrowser.copyUrl': 'Kopier URL',
  'designBrowser.openExternal': 'Åpne i ekstern nettleser',
  'designBrowser.downloadPage': 'Last ned siden',
  'designBrowser.downloadPageBusy': 'Laster ned siden …',
  'designBrowser.clearHistory': 'Tøm historikk',
  'designBrowser.clearCookies': 'Tøm informasjonskapsler',
  'designBrowser.clearAllData': 'Tøm alle nettleserdata',
  'designBrowser.status.urlCopied': 'URL kopiert.',
  'designBrowser.status.noUrlToCopy': 'Ingen URL å kopiere.',
  'designBrowser.status.screenshotSaved': 'Skjermbilde lagret.',
  'designBrowser.status.screenshotFailed': 'Kunne ikke ta skjermbilde.',
  'designBrowser.status.browserDataCleared': 'Nettleserdataene er tømt.',
  'designBrowser.status.historyCleared': 'Historikken er tømt.',

  // ── Settings: shell ──────────────────────────────────────────────
  'settings.kicker': 'Innstillinger',
  'settings.title': 'Modeller og leverandører',
  'settings.subtitle': 'Velg en lokal CLI eller BYOK.',
  'settings.general': 'Generelt',
  'settings.generalHint':
    'Språk, utseende, varsler, prosjektplasseringer, personvern og appinformasjon.',
  'settings.modeDaemon': 'Lokal CLI',
  'settings.modeDaemonHelp': 'Kjør gjennom en kodeagent-CLI på denne maskinen',
  'settings.modeApi': 'API-leverandør',
  'settings.codeAgent': 'Kodeagent',
  'settings.rescan': '↻ Skann på nytt',
  'settings.rescanTitle': 'Skann PATH på nytt',
  'settings.rescanRunning': 'Skanner …',
  'settings.rescanSuccess': 'Skannet fullført. Tilgjengelig: {count}.',

  // ── Home hero ────────────────────────────────────────────────────
  'homeHero.chip.prototype': 'Prototype',

  // ── Entry: navigation / account ──────────────────────────────────
  'entry.navDrafts': 'Alle prosjekter',
  'entry.navProjects': 'Prosjekter',
  'workspaceSwitcher.draftsTooltip': 'Alle prosjekter',
  'entry.creditsUpgrade': 'Oppgrader',
  'entry.creditsUsage': 'Bruk',
  'entry.accountToggleTheme': 'Bytt tema',
  'entry.accountSwitchLanguage': 'Bytt språk',
  'entry.accountAddAccount': 'Legg til konto',
  'entry.accountSignOut': 'Logg ut',

  // ── Error-card support CTA ───────────────────────────────────────
  'chat.runError.contactSupportCta': 'Kontakt oss',

  // ── Assistant status ─────────────────────────────────────────────
  'assistant.waitingFirstOutput': 'Venter på modellens første svar …',

  // ── DeepSeek V4 Flash campaign (explicit matrix keys) ────────────
  'campaign.deepseekV4Flash.headline': 'Denne gangen: toppmodeller uten grenser.',
  'campaign.deepseekV4Flash.description':
    'Landingssider, nettsteder, presentasjoner og bilder – lag så mange du vil til det sitter.',
  'campaign.deepseekV4Flash.benefit': 'Ubegrenset DeepSeek V4 Pro og V4 Flash',
  'campaign.deepseekV4Flash.timing': '13.–27. august: gratis i kampanjeperioden',
  'campaign.deepseekV4Flash.ruleSummary':
    'Fra 13. til 27. august kan betalende brukere bruke DeepSeek V4 Pro og V4 Flash gratis i SplatStudio. Omfattende misbruk kan stanse kampanjetilgangen.',
  'campaign.deepseekV4Flash.windowLabel': '13.–27. august',
  'campaign.deepseekV4Flash.weekFreeSuffix': 'to uker gratis',
  'campaign.deepseekV4Flash.boundary':
    'Ubegrenset modellkvote og gratis genereringer i planen gjelder bare i SplatStudio – ikke via MCP, CLI, API eller andre flater. Endelig vurdering ligger hos SplatStudio. Enkelte modeller kan måtte stå i kø i rushtiden.',
  'campaign.deepseekV4Flash.countdownLabel': 'Nedtelling til kampanjeslutt',
  'campaign.deepseekV4Flash.countdownEnded': 'Kampanjen er over',
  'campaign.deepseekV4Flash.countdownRemaining': '{days}d {hms}',
  'campaign.deepseekV4Flash.closeAria': 'Lukk',
  'campaign.deepseekV4Flash.unlocked': 'Låst opp',
  'campaign.deepseekV4Flash.locked': 'Låst',
  'campaign.deepseekV4Flash.later': 'Ikke nå',
  'campaign.deepseekV4Flash.paid.eyebrow': 'To uker gratis',
  'campaign.deepseekV4Flash.paid.status': 'Låst opp · 13.–27. august',
  'campaign.deepseekV4Flash.paid.cta': 'Bruk nå',
  'campaign.deepseekV4Flash.paid.modelBadge': 'Ubegrenset',
  'campaign.deepseekV4Flash.unpaid.eyebrow': 'Gratis for betalplaner',
  'campaign.deepseekV4Flash.unpaid.status': 'Oppgrader for å låse opp · til 27. august',
  'campaign.deepseekV4Flash.unpaid.cta': 'Oppgrader og bruk',
  'campaign.deepseekV4Flash.unpaid.modelBadge': 'Oppgrader for å bruke',
  'campaign.deepseekV4Flash.unpaid.tooltip':
    'Abonner i kampanjeperioden for å bruke det gratis; slutter 27. august.',
  'campaign.deepseekV4Flash.restricted.modelBadge': 'Satt på pause',
  'campaign.deepseekV4Flash.restricted.tooltip':
    'Uvanlig høy bruk ble oppdaget, så kampanjetilgangen er satt på pause. Kontakt support hvis du trenger hjelp.',
  'campaign.deepseekV4Flash.workbenchBadge': 'DeepSeek V4 Pro + V4 Flash ubegrenset gratis',
  'campaign.deepseekV4Flash.workbenchBadgeAria':
    'DeepSeek V4 Pro og V4 Flash ubegrenset gratis – se priser',
};
