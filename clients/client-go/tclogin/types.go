// This source code file is AUTO-GENERATED by github.com/taskcluster/jsonschema2go

package tclogin

import (
	tcclient "github.com/taskcluster/taskcluster/clients/client-go/v22"
)

type (
	// A response containing credentials corresponding to a supplied OIDC `access_token`.
	CredentialsResponse struct {

		// Taskcluster credentials. Note that the credentials may not contain a certificate!
		Credentials TaskclusterCredentials `json:"credentials"`

		// Time after which the credentials are no longer valid.  Callers should
		// call `oidcCredentials` again to get fresh credentials before this time.
		Expires tcclient.Time `json:"expires"`
	}

	// Taskcluster credentials. Note that the credentials may not contain a certificate!
	TaskclusterCredentials struct {

		// Syntax:     ^[a-zA-Z0-9_-]{22,66}$
		AccessToken string `json:"accessToken"`

		Certificate string `json:"certificate,omitempty"`

		// Syntax:     ^[A-Za-z0-9!@/:.+|_-]+$
		ClientID string `json:"clientId"`
	}
)
