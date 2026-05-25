/**
 * Keycloak client singleton configuration.
 * Reads connection settings from Vite environment variables.
 */

import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'whiteboard',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'whiteboard-app',
});

export default keycloak;
