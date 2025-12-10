  import { defineConfig , env} from '@prisma/client/generator';

    export default (defineConfig) ({
      schema: "prisma/schema.prisma",
      migrations: {
        path: "prisma/migrations",
      },
      datasource: {
        url: env("DATABASE_URL"),
      },
    });