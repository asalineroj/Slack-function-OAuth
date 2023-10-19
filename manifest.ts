import { DefineFunction, DefineOAuth2Provider, DefineWorkflow, Manifest, Schema } from "deno-slack-sdk/mod.ts";

//Function defined in functions
import { InterpretColorFunction } from "./functions/interpret_color.ts";
import crypto from 'node:crypto'

//deno function to import env variables, also added in import_map.json
import "std/dotenv/load.ts";

// Define a new OAuth2 provider
// Note: CLIENT_ID as an env variable
// if you're following along and creating an OAuth2 provider for
// Airtable. 
const codeVerifier = crypto.randomBytes(96).toString('base64url');
const codeChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier) // hash the code verifier with the sha256 algorithm
        .digest('base64') // base64 encode, needs to be transformed to base64url
        .replace(/=/g, '') // remove =
        .replace(/\+/g, '-') // replace + with -
        .replace(/\//g, '_'); // replace / with _ now base64url encoded
const state = crypto.randomBytes(100).toString('base64url');

const clientID = Deno.env.get("CLIENT_ID");


const AirtableProvider = DefineOAuth2Provider({
  provider_key: "airtable",
  provider_type: Schema.providers.oauth2.CUSTOM,
  options: {
    "provider_name": "Airtable",
    "authorization_url": "https://airtable.com/oauth2/v1/authorize",
    "token_url": "https://airtable.com/oauth2/v1/token",
    "client_id": clientID, //to be added from env before uploading to repo
    "scope": [
      "data.records:read",
      "data.records:write",
      "data.recordComments:read",
      "data.recordComments:write",
      "schema.bases:read",
      "schema.bases:write",
      "user.email:read",
      "webhook:manage"
    ],
    "authorization_url_extras": {
      "redirect_uri": "https://oauth2.slack.com/external/auth/callback",
      "response_type": "code",
      "state": state,
      "code_challenge": codeChallenge,
      "code_challenge_method": "S256",
      "code_verifier": codeVerifier,
    },
    'use_pkce':  true,
    "token_url_config": {
      "use_basic_auth_scheme": true,
    },
    "identity_config": {
      "url": "https://api.airtable.com/v0/meta/whoami",
      "account_identifier": "$.id",
    },
  },
});

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/future/manifest
 */
export default Manifest({
  name: "Meaning of Color App",
  description: "The meaning of colors",
  icon: "assets/default_new_app_icon.png",
  functions: [InterpretColorFunction],
  workflows: [],
  outgoingDomains: ["airtable.com"],
  externalAuthProviders:[AirtableProvider],
  botScopes: ["commands", "chat:write", "chat:write.public"],
});
