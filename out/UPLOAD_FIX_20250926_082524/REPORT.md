# Upload Fix Report
**UTC Timestamp**: 20250926_082524
**Project Root**: .
**Executed By**: PC@wonicom

## Environment Check
### Tool Versions
```
git version 2.51.0.windows.1
v22.18.0
11.5.2
scripts/upload_fix.sh: line 68: supabase: command not found
supabase: NOT INSTALLED
```
### Network Connectivity
- GitHub: ✅ OK
- Supabase: ✅ OK
## ❌ GitHub: Missing GITHUB_TOKEN for HTTPS
## ⚠️ Supabase CLI Not Installed
Install with: npm install -g supabase
Or download from: https://github.com/supabase/cli/releases
## ❌ Supabase REST: Missing credentials

## Final Status
### Git Repository
```
 M .claude/settings.local.json
 M .env.example
 M .github/workflows/m30-step5-ci.yml.disabled
 M .github/workflows/m37-copilot-ci.yml.disabled
 M .github/workflows/release_m30.yml.disabled
 M .gitignore
 M CLAUDE.md
 D KIS_ESTIMATOR_BUILD/assets/index-D9wiwmz7.js
 D KIS_ESTIMATOR_BUILD/assets/index-DoR81rmM.css
 D KIS_ESTIMATOR_BUILD/index.html
 D KIS_FINAL_BUILD_20250924/assets/index-D9wiwmz7.js
 D KIS_FINAL_BUILD_20250924/assets/index-DoR81rmM.css
 D KIS_FINAL_BUILD_20250924/index.html
 D SPEC_KIT_KICKOFF_v3.0.0_20240922.zip
 D SPEC_KIT_KICKOFF_v3.0.0_20240922.zip.sha256
 D SPEC_KIT_KICKOFF_v3.0.0_20240922_FINAL.zip
 D SPEC_KIT_KICKOFF_v3.0.0_20240922_FINAL.zip.sha256
 D actionlint.tar.gz
 D ai_estimator_backup_20250924_003607/README.md
 D ai_estimator_backup_20250924_003607/index.html
 D ai_estimator_backup_20250924_003607/package-lock.json
 D ai_estimator_backup_20250924_003607/package.json
 D ai_estimator_backup_20250924_003607/scripts/debug-app.tsx
 D ai_estimator_backup_20250924_003607/scripts/debug-sidebar.tsx
 D ai_estimator_backup_20250924_003607/src/App.tsx
 D ai_estimator_backup_20250924_003607/src/Attributions.md
 D ai_estimator_backup_20250924_003607/src/BACKUP_README.md
 D ai_estimator_backup_20250924_003607/src/components/chat-components.tsx
 D ai_estimator_backup_20250924_003607/src/components/erp-components.tsx
 D ai_estimator_backup_20250924_003607/src/components/erp-system-backup.tsx
 D ai_estimator_backup_20250924_003607/src/components/erp-system.tsx
 D ai_estimator_backup_20250924_003607/src/components/figma/ImageWithFallback.tsx
 D ai_estimator_backup_20250924_003607/src/components/hero-section.tsx
 D ai_estimator_backup_20250924_003607/src/components/projects-view.tsx
 D ai_estimator_backup_20250924_003607/src/components/quote-system.tsx
 D ai_estimator_backup_20250924_003607/src/components/sidebar-components.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/accordion.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/alert-dialog.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/alert.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/aspect-ratio.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/avatar.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/badge.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/breadcrumb.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/button.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/calendar.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/card.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/carousel.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/chart.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/checkbox.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/collapsible.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/command.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/context-menu.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/dialog.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/drawer.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/dropdown-menu.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/form.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/hover-card.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/input-otp.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/input.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/label.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/menubar.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/navigation-menu.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/pagination.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/popover.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/progress.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/radio-group.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/resizable.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/scroll-area.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/select.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/separator.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/sheet.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/sidebar.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/skeleton.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/slider.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/sonner.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/switch.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/table.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/tabs.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/textarea.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/toggle-group.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/toggle.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/tooltip.tsx
 D ai_estimator_backup_20250924_003607/src/components/ui/use-mobile.ts
 D ai_estimator_backup_20250924_003607/src/components/ui/utils.ts
 D ai_estimator_backup_20250924_003607/src/components/work-panel.tsx
 D ai_estimator_backup_20250924_003607/src/components/workspace-settings.tsx
 D ai_estimator_backup_20250924_003607/src/guidelines/Guidelines.md
 D ai_estimator_backup_20250924_003607/src/index.css
 D ai_estimator_backup_20250924_003607/src/main.tsx
 D ai_estimator_backup_20250924_003607/src/styles/globals.css
 D ai_estimator_backup_20250924_003607/vite.config.ts
 D ai_estimator_final_complete_20250924_004748/README.md
 D ai_estimator_final_complete_20250924_004748/index.html
 D ai_estimator_final_complete_20250924_004748/package-lock.json
 D ai_estimator_final_complete_20250924_004748/package.json
 D ai_estimator_final_complete_20250924_004748/scripts/debug-app.tsx
 D ai_estimator_final_complete_20250924_004748/scripts/debug-sidebar.tsx
 D ai_estimator_final_complete_20250924_004748/src/App.tsx
 D ai_estimator_final_complete_20250924_004748/src/Attributions.md
 D ai_estimator_final_complete_20250924_004748/src/BACKUP_README.md
 D ai_estimator_final_complete_20250924_004748/src/components/chat-components.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/erp-components.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/erp-system-backup.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/erp-system.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/figma/ImageWithFallback.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/hero-section.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/projects-view.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/quote-system.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/sidebar-components.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/accordion.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/alert-dialog.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/alert.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/aspect-ratio.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/avatar.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/badge.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/breadcrumb.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/button.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/calendar.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/card.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/carousel.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/chart.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/checkbox.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/collapsible.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/command.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/context-menu.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/dialog.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/drawer.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/dropdown-menu.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/form.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/hover-card.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/input-otp.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/input.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/label.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/menubar.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/navigation-menu.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/pagination.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/popover.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/progress.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/radio-group.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/resizable.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/scroll-area.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/select.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/separator.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/sheet.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/sidebar.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/skeleton.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/slider.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/sonner.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/switch.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/table.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/tabs.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/textarea.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/toggle-group.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/toggle.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/tooltip.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/ui/use-mobile.ts
 D ai_estimator_final_complete_20250924_004748/src/components/ui/utils.ts
 D ai_estimator_final_complete_20250924_004748/src/components/work-panel.tsx
 D ai_estimator_final_complete_20250924_004748/src/components/workspace-settings.tsx
 D ai_estimator_final_complete_20250924_004748/src/guidelines/Guidelines.md
 D ai_estimator_final_complete_20250924_004748/src/index.css
 D ai_estimator_final_complete_20250924_004748/src/main.tsx
 D ai_estimator_final_complete_20250924_004748/src/styles/globals.css
 D ai_estimator_final_complete_20250924_004748/vite.config.ts
 D ai_estimator_restored/README.md
 D ai_estimator_restored/index.html
 D ai_estimator_restored/package-lock.json
 D ai_estimator_restored/package.json
 D ai_estimator_restored/scripts/debug-app.tsx
 D ai_estimator_restored/scripts/debug-sidebar.tsx
 D ai_estimator_restored/src/App.tsx
 D ai_estimator_restored/src/Attributions.md
 D ai_estimator_restored/src/BACKUP_README.md
 D ai_estimator_restored/src/components/chat-components.tsx
 D ai_estimator_restored/src/components/erp-components.tsx
 D ai_estimator_restored/src/components/erp-system-backup.tsx
 D ai_estimator_restored/src/components/erp-system.tsx
 D ai_estimator_restored/src/components/figma/ImageWithFallback.tsx
 D ai_estimator_restored/src/components/hero-section.tsx
 D ai_estimator_restored/src/components/projects-view.tsx
 D ai_estimator_restored/src/components/quote-system.tsx
 D ai_estimator_restored/src/components/sidebar-components.tsx
 D ai_estimator_restored/src/components/ui/accordion.tsx
 D ai_estimator_restored/src/components/ui/alert-dialog.tsx
 D ai_estimator_restored/src/components/ui/alert.tsx
 D ai_estimator_restored/src/components/ui/aspect-ratio.tsx
 D ai_estimator_restored/src/components/ui/avatar.tsx
 D ai_estimator_restored/src/components/ui/badge.tsx
 D ai_estimator_restored/src/components/ui/breadcrumb.tsx
 D ai_estimator_restored/src/components/ui/button.tsx
 D ai_estimator_restored/src/components/ui/calendar.tsx
 D ai_estimator_restored/src/components/ui/card.tsx
 D ai_estimator_restored/src/components/ui/carousel.tsx
 D ai_estimator_restored/src/components/ui/chart.tsx
 D ai_estimator_restored/src/components/ui/checkbox.tsx
 D ai_estimator_restored/src/components/ui/collapsible.tsx
 D ai_estimator_restored/src/components/ui/command.tsx
 D ai_estimator_restored/src/components/ui/context-menu.tsx
 D ai_estimator_restored/src/components/ui/dialog.tsx
 D ai_estimator_restored/src/components/ui/drawer.tsx
 D ai_estimator_restored/src/components/ui/dropdown-menu.tsx
 D ai_estimator_restored/src/components/ui/form.tsx
 D ai_estimator_restored/src/components/ui/hover-card.tsx
 D ai_estimator_restored/src/components/ui/input-otp.tsx
 D ai_estimator_restored/src/components/ui/input.tsx
 D ai_estimator_restored/src/components/ui/label.tsx
 D ai_estimator_restored/src/components/ui/menubar.tsx
 D ai_estimator_restored/src/components/ui/navigation-menu.tsx
 D ai_estimator_restored/src/components/ui/pagination.tsx
 D ai_estimator_restored/src/components/ui/popover.tsx
 D ai_estimator_restored/src/components/ui/progress.tsx
 D ai_estimator_restored/src/components/ui/radio-group.tsx
 D ai_estimator_restored/src/components/ui/resizable.tsx
 D ai_estimator_restored/src/components/ui/scroll-area.tsx
 D ai_estimator_restored/src/components/ui/select.tsx
 D ai_estimator_restored/src/components/ui/separator.tsx
 D ai_estimator_restored/src/components/ui/sheet.tsx
 D ai_estimator_restored/src/components/ui/sidebar.tsx
 D ai_estimator_restored/src/components/ui/skeleton.tsx
 D ai_estimator_restored/src/components/ui/slider.tsx
 D ai_estimator_restored/src/components/ui/sonner.tsx
 D ai_estimator_restored/src/components/ui/switch.tsx
 D ai_estimator_restored/src/components/ui/table.tsx
 D ai_estimator_restored/src/components/ui/tabs.tsx
 D ai_estimator_restored/src/components/ui/textarea.tsx
 D ai_estimator_restored/src/components/ui/toggle-group.tsx
 D ai_estimator_restored/src/components/ui/toggle.tsx
 D ai_estimator_restored/src/components/ui/tooltip.tsx
 D ai_estimator_restored/src/components/ui/use-mobile.ts
 D ai_estimator_restored/src/components/ui/utils.ts
 D ai_estimator_restored/src/components/work-panel.tsx
 D ai_estimator_restored/src/components/workspace-settings.tsx
 D ai_estimator_restored/src/guidelines/Guidelines.md
 D ai_estimator_restored/src/index.css
 D ai_estimator_restored/src/main.tsx
 D ai_estimator_restored/src/services/api.ts
 D ai_estimator_restored/src/styles/globals.css
 D ai_estimator_restored/vite.config.ts
 D ai_estimator_working/README.md
 D ai_estimator_working/index.html
 D ai_estimator_working/package-lock.json
 D ai_estimator_working/package.json
 D ai_estimator_working/scripts/debug-app.tsx
 D ai_estimator_working/scripts/debug-sidebar.tsx
 D ai_estimator_working/src/App.tsx
 D ai_estimator_working/src/Attributions.md
 D ai_estimator_working/src/BACKUP_README.md
 D ai_estimator_working/src/components/calendar-module.tsx
 D ai_estimator_working/src/components/chat-components.tsx
 D ai_estimator_working/src/components/drawings-module.tsx
 D ai_estimator_working/src/components/email-module.tsx
 D ai_estimator_working/src/components/erp-components.tsx
 D ai_estimator_working/src/components/erp-system-backup.tsx
 D ai_estimator_working/src/components/erp-system-clean.tsx
 D ai_estimator_working/src/components/erp-system-simple.tsx
 D ai_estimator_working/src/components/erp-system.tsx
 D ai_estimator_working/src/components/figma/ImageWithFallback.tsx
 D ai_estimator_working/src/components/hero-section.tsx
 D ai_estimator_working/src/components/projects-view.tsx
 D ai_estimator_working/src/components/quote-system.tsx
 D ai_estimator_working/src/components/settings-module.tsx
 D ai_estimator_working/src/components/sidebar-components.tsx
 D ai_estimator_working/src/components/ui/accordion.tsx
 D ai_estimator_working/src/components/ui/alert-dialog.tsx
 D ai_estimator_working/src/components/ui/alert.tsx
 D ai_estimator_working/src/components/ui/aspect-ratio.tsx
 D ai_estimator_working/src/components/ui/avatar.tsx
 D ai_estimator_working/src/components/ui/badge.tsx
 D ai_estimator_working/src/components/ui/breadcrumb.tsx
 D ai_estimator_working/src/components/ui/button.tsx
 D ai_estimator_working/src/components/ui/calendar.tsx
 D ai_estimator_working/src/components/ui/card.tsx
 D ai_estimator_working/src/components/ui/carousel.tsx
 D ai_estimator_working/src/components/ui/chart.tsx
 D ai_estimator_working/src/components/ui/checkbox.tsx
 D ai_estimator_working/src/components/ui/collapsible.tsx
 D ai_estimator_working/src/components/ui/command.tsx
 D ai_estimator_working/src/components/ui/context-menu.tsx
 D ai_estimator_working/src/components/ui/dialog.tsx
 D ai_estimator_working/src/components/ui/drawer.tsx
 D ai_estimator_working/src/components/ui/dropdown-menu.tsx
 D ai_estimator_working/src/components/ui/form.tsx
 D ai_estimator_working/src/components/ui/hover-card.tsx
 D ai_estimator_working/src/components/ui/input-otp.tsx
 D ai_estimator_working/src/components/ui/input.tsx
 D ai_estimator_working/src/components/ui/label.tsx
 D ai_estimator_working/src/components/ui/menubar.tsx
 D ai_estimator_working/src/components/ui/navigation-menu.tsx
 D ai_estimator_working/src/components/ui/pagination.tsx
 D ai_estimator_working/src/components/ui/popover.tsx
 D ai_estimator_working/src/components/ui/progress.tsx
 D ai_estimator_working/src/components/ui/radio-group.tsx
 D ai_estimator_working/src/components/ui/resizable.tsx
 D ai_estimator_working/src/components/ui/scroll-area.tsx
 D ai_estimator_working/src/components/ui/select.tsx
 D ai_estimator_working/src/components/ui/separator.tsx
 D ai_estimator_working/src/components/ui/sheet.tsx
 D ai_estimator_working/src/components/ui/sidebar.tsx
 D ai_estimator_working/src/components/ui/skeleton.tsx
 D ai_estimator_working/src/components/ui/slider.tsx
 D ai_estimator_working/src/components/ui/sonner.tsx
 D ai_estimator_working/src/components/ui/switch.tsx
 D ai_estimator_working/src/components/ui/table.tsx
 D ai_estimator_working/src/components/ui/tabs.tsx
 D ai_estimator_working/src/components/ui/textarea.tsx
 D ai_estimator_working/src/components/ui/toggle-group.tsx
 D ai_estimator_working/src/components/ui/toggle.tsx
 D ai_estimator_working/src/components/ui/tooltip.tsx
 D ai_estimator_working/src/components/ui/use-mobile.ts
 D ai_estimator_working/src/components/ui/utils.ts
 D ai_estimator_working/src/components/work-panel.tsx
 D ai_estimator_working/src/components/workspace-settings.tsx
 D ai_estimator_working/src/guidelines/Guidelines.md
 D ai_estimator_working/src/index.css
 D ai_estimator_working/src/main.tsx
 D ai_estimator_working/src/styles/globals.css
 D ai_estimator_working/vite.config.ts
 M kis-backend/package-lock.json
 M kis-backend/package.json
 D kis-backend/prisma/migrations/20250923161820_init/migration.sql
 D kis-backend/prisma/migrations/20250923181310_add_evidence_signature_fields/migration.sql
 D kis-backend/prisma/migrations/20250923181926_add_idempotency_key_table/migration.sql
 D kis-backend/prisma/migrations/manual_knowledge_versioning/migration.sql
 D kis-backend/prisma/migrations/migration_lock.toml
 M kis-backend/prisma/schema.prisma
 M kis-backend/src/app.ts
 M kis-backend/src/config.ts
 M kis-backend/src/lib/json-schemas.ts
 M kis-backend/src/lib/pre-gates.ts
 M kis-backend/src/lib/size-tables.ts
 M kis-backend/src/lib/validators.ts
 M kis-backend/src/regression/golden.ts
 M kis-backend/src/routes/estimate.ts
 M kis-backend/src/services/estimate.service.ts
 M kis-backend/vitest.integration.config.ts
 D layout-detailed-1200x800.png
 D layout-detailed-1600x900.png
 D layout-detailed-1920x1080.png
 D layout-test-1200x800.png
 M mcp-servers/official-servers/src/everything/CLAUDE.md
 M package.json
 D quick-test-1200x800.png
 D quick-test-1600x900.png
 D quick-test-1920x1080.png
 D test-layout-responsive.js
 D test-supabase.js
 D test-tables.js
 D ui/CHAT.png
 D ui/bar.png
 D ui/erp.png
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031335.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031357.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031405.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031417.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031431.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031440.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031450.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031458.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031503.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031513.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031522.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031529.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031539.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031556.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031608.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031616.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031633.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031646.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031656.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031738.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031751.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031809.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031817.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031832.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031849.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031901.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031919.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031940.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 031949.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 032001.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 032014.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 032024.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 032036.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 032049.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 032059.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 032120.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 032125.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 032129.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 032204.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 032209.png"
 D "ui/erp/\354\212\244\355\201\254\353\246\260\354\203\267 2025-09-22 032241.png"
 D ui/gpt.png
 M ui/index.html
 D ui/ui1.png
 D ui/ui2.png
 D ui/ui3.png
 D ui/ui4.png
 D "ui/\354\212\244\355\201\254\353\246\260\354\203\2671.png"
 D "ui/\354\212\244\355\201\254\353\246\260\354\203\2672.png"
 D uiexample.png
?? .evidence/
?? .venv/
?? SHA256SUMS.txt
?? api/
?? claudedocs/
?? dev_nowatch.pid
?? frontend-kis-complete.html
?? frontend-kis.html
?? kis-backend/evidence-samples/
?? kis-backend/src/app.ts.broken
?? kis-backend/src/lib/json-schemas-extended.ts
?? kis-backend/src/lib/observability.ts
?? kis-backend/src/plugins/
?? kis-backend/test/regression/
?? mcp/
?? nul
?? ops/Dockerfile
?? ops/README.md
?? ops/dev.env.example
?? ops/docker-compose.yml
?? ops/migrations/
?? ops/run_server.sh
?? ops/run_tests.sh
?? out/ARTIFACT_V4_MIGRATION/
?? out/FIX_SECRETS_CTX/
?? out/SCHEMA_HASH_20250926_073257/
?? out/SCHEMA_HASH_20250926_073329/
?? out/SCHEMA_HASH_20250926_073337/
?? out/SCHEMA_HASH_20250926_073354/
?? out/SCHEMA_HASH_20250926_073409/
?? out/SCHEMA_HASH_20250926_073529/
?? out/SCHEMA_HASH_20250926_073613/
?? out/SCHEMA_HASH_20250926_073635/
?? out/SCHEMA_HASH_20250926_073751/
?? out/UPLOAD_FIX_20250926_082524/
?? out/WORKFLOW_NORMALIZE_20250926_080915/
?? out/WORKFLOW_NORMALIZE_20250926_080945/
?? payload_samples/
?? scripts/health_probe.mjs
?? scripts/port_guard.mjs
?? scripts/regression-test.sh
?? scripts/repro_quote_create.py
?? scripts/seed_regression.py
?? scripts/upload_fix.sh
?? scripts/validate_schema_hashes.sh
?? scripts/verify_frontend_contract.py
?? spec/
?? tests/regression/seeds.jsonl
?? tests/smoke/run_smoke.mjs
?? tests/test_ai_manager_route.py
?? tests/test_estimate_quotes.py
?? tests/test_health.py
?? tests/test_stub_routes.py
?? "ui/erp/\352\261\260\353\236\230\353\252\205\354\204\270\354\204\234-\353\263\264\352\263\240\354\204\234\355\224\204\353\246\260\355\212\270\355\225\230\353\212\224\353\260\251\353\262\225.png"
?? "ui/erp/\352\261\260\353\236\230\353\252\205\354\204\270\354\204\234\354\235\264\353\251\224\354\235\274\354\240\204\354\206\241.png"
?? "ui/erp/\352\261\260\353\236\230\354\262\230\353\223\261\353\241\235.png"
?? "ui/erp/\352\261\260\353\236\230\354\262\230\353\263\204-\354\203\201\355\222\210\353\213\250\352\260\200.png"
?? "ui/erp/\352\270\211\354\227\254\353\252\205\354\204\270\354\204\234\353\223\261\353\241\235-\354\235\264\353\251\224\354\235\274\354\240\204\354\206\241.png"
?? "ui/erp/\352\270\211\354\227\254\354\204\244\354\240\225.png"
?? "ui/erp/\352\270\211\354\227\254\354\240\225\353\263\264\353\223\261\353\241\235.png"
?? "ui/erp/\352\270\260\352\260\204\353\263\204\355\206\265\352\263\204\353\266\204\354\204\235.png"
?? "ui/erp/\353\213\250\352\260\200\352\264\200\353\246\254\353\260\217\354\265\234\354\242\205\353\213\250\352\260\200.png"
?? "ui/erp/\353\247\244\354\236\205\353\247\244\354\266\234\354\210\230\352\270\210\354\247\200\352\270\211\354\236\205\354\266\234\352\270\210\354\241\260\353\246\275\354\240\204\355\221\234.png"
?? "ui/erp/\353\247\244\354\236\205\354\240\204\355\221\234.png"
?? "ui/erp/\353\254\270\354\236\220\353\260\234\354\206\241.png"
?? "ui/erp/\353\257\270\354\210\230\352\270\210\353\260\217\353\257\270\354\247\200\352\270\211\352\270\210\354\241\260\355\232\214\353\260\251\353\262\225.png"
?? "ui/erp/\353\257\270\354\210\230\353\257\270\354\247\200\352\270\211\352\270\210\354\235\264\354\233\224.png"
?? "ui/erp/\354\202\254\354\233\220\353\223\261\353\241\235.png"
?? "ui/erp/\354\203\201\353\213\250\353\260\224\354\227\220\353\223\244\354\226\264\352\260\210\352\270\260\353\212\245.png"
?? "ui/erp/\354\203\201\353\213\250\355\214\251\354\212\244\354\240\204\354\206\241\353\260\251\353\262\225.png"
?? "ui/erp/\354\203\201\355\222\210\353\223\261\353\241\235.png"
?? "ui/erp/\354\203\201\355\222\210\353\263\204\354\227\205\354\262\264\353\213\250\352\260\200\355\221\234.png"
?? "ui/erp/\354\203\201\355\222\210\354\236\254\352\263\240\354\235\264\354\233\224.png"
?? "ui/erp/\354\226\264\354\235\214\354\235\264\354\233\224.png"
?? "ui/erp/\354\227\221\354\205\200-\354\235\264\353\257\270\354\247\200-PDF\355\214\214\354\235\274\354\240\200\354\236\245\353\260\251\353\262\225.png"
?? "ui/erp/\354\233\220\352\260\200\354\236\254\352\263\204\354\202\260.png"
?? "ui/erp/\354\235\200\355\226\211\354\236\224\352\263\240\354\235\264\354\233\224.png"
?? "ui/erp/\354\235\274\352\263\204\355\221\234-\354\233\224\352\263\204\355\221\234_\354\203\201\354\204\270\354\241\260\355\232\214.png"
?? "ui/erp/\354\236\205\354\266\234\352\270\210-\352\262\275\353\271\204\353\223\261\353\241\235.png"
?? "ui/erp/\354\236\205\354\266\234\352\270\210\355\225\255\353\252\251\353\223\261\353\241\235.png"
?? "ui/erp/\354\236\220\353\243\214\354\235\230\353\260\261\354\227\205\352\263\274\353\263\265\354\233\220\353\260\251\353\262\225.png"
?? "ui/erp/\354\236\220\354\202\254\354\235\200\355\226\211\352\263\204\354\242\214\353\223\261\353\241\235.png"
?? "ui/erp/\354\236\220\354\202\254\354\240\225\353\263\264\353\223\261\353\241\235.png"
?? "ui/erp/\354\236\254\352\263\240\354\241\260\354\240\225.png"
?? "ui/erp/\354\240\204\354\236\220\354\204\270\352\270\210\352\263\204\354\202\260\354\204\234\353\260\234\355\226\211-\353\247\244\354\266\234\354\240\204\355\221\234\354\227\220\354\204\234 \354\204\270\352\270\210\352\263\204\354\202\260\354\204\234\353\260\234\355\226\211.png"
?? "ui/erp/\354\240\204\355\221\234\354\210\230\354\240\225-\354\202\255\354\240\234\353\260\251\353\262\225.png"
?? "ui/erp/\354\240\204\355\221\234\355\225\255\353\252\251\354\264\210\352\270\260\355\231\224\353\260\251\353\262\225.png"
?? "ui/erp/\354\242\205\355\225\251\354\206\220\354\235\265\355\230\204\355\231\251.png"
?? "ui/erp/\354\261\204\352\266\214\354\261\204\353\254\264\354\235\264\354\233\224.png"
?? "ui/erp/\355\230\204\352\270\210\354\236\224\352\263\240\354\235\264\354\233\224.png"
?? verification/

Latest commit: 9c0c7a7 - chore(ci): normalize workflows to UTF-8+LF and update artifact actions to v4
Current branch: chore/actions-artifacts-v4
Remote: https://github.com/kanno321-create/KARA_PROJECT.git
```

### Evidence Files
- Main log: ./out/UPLOAD_FIX_20250926_082524/main.log
- GitHub logs: ./out/UPLOAD_FIX_20250926_082524/github_*.log
- Supabase logs: ./out/UPLOAD_FIX_20250926_082524/supabase_*.log
- Secrets check: ./out/UPLOAD_FIX_20250926_082524/secrets_check.log
