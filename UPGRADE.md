# Migrate from PILOS v1 to PILOS v2

The database schema has changed quite a lot from v1 to v2.
This was necessary to support PostgreSQL in the future.
This version also fixes inconsistent naming of table columns, make development easier and cleanup to long migrations list.

To migrate to v2 just run: `php artisan migrate` or if you are using sail: `sail artisan migrate`
