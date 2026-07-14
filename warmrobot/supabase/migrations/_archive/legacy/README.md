# Legacy Supabase Migrations

These files (`001`–`006`) were the original manually-run SQL scripts for Supabase Dashboard.

They duplicate the timestamp-prefixed versions in the parent `migrations/` folder:

| Legacy | Canonical |
|--------|-----------|
| `001_initial_schema.sql` | `20240101000001_initial_schema.sql` |
| `002_storage_setup.sql` | `20240101000002_storage_setup.sql` |
| `003_materials.sql` | `20240101000003_materials.sql` |
| `004_fix_schema.sql` | `20240101000004_fix_schema.sql` |
| `005_seed_mock_data.sql` | `20240101000005_seed_mock_data.sql` |
| `006_stitch_ui_fields.sql` | `20240101000006_stitch_ui_fields.sql` |

Later migrations (`007`–`013`) were also renamed to timestamp prefixes:

| Old name | Canonical |
|----------|-----------|
| `007_product_catalog.sql` | `20240101000007_product_catalog.sql` |
| `008_baby_profile_fields.sql` | `20240101000008_baby_profile_fields.sql` |
| `009_clothing_fit_type.sql` | `20240101000009_clothing_fit_type.sql` |
| `010_clothing_category_enum_values.sql` | `20240101000010_clothing_category_enum_values.sql` |
| `011_clothing_category_hierarchy.sql` | `20240101000011_clothing_category_hierarchy.sql` |
| `012_enum_spec_values.sql` | `20240101000012_enum_spec_values.sql` |
| `013_enum_spec_sync.sql` | `20240101000013_enum_spec_sync.sql` |

Use the timestamp versions for `supabase db reset`. Keep legacy copies only for reference.
