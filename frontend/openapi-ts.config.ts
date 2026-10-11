import { defineConfig } from '@hey-api/openapi-ts';

const BACKEND_ADDRESS =  process.env.BACKEND_ADDRESS
if (!BACKEND_ADDRESS) throw new Error("BACKEND_ADDRESS not configured.")

export default defineConfig({
  input: BACKEND_ADDRESS + '/openapi.json', // or a saved openapi.json
  output: {
    path:'src/client',
    indexFile:false
  },
  plugins: [
    { name: '@hey-api/typescript',
      enums: {
        mode: 'javascript',
      },
      requests:false,
      responses:false,
      definitions:true
    },
    {
      name:'zod',
      requests:false,
      responses:false,
      definitions: true
    },
    // {
    //   name: '@hey-api/transformers',
    //   dates: true,
    // },
  ]
});