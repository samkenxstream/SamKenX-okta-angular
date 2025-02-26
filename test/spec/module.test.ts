import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthSdkError, OktaAuth } from '@okta/okta-auth-js';
import { 
  OktaAuthModule, 
  OKTA_CONFIG, 
  OKTA_AUTH,
  OktaAuthStateService, 
  OktaAuthGuard 
} from '../../lib/src/okta-angular';

jest.mock('../../lib/src/okta/packageInfo', () => ({
  __esModule: true,
  default: {
    authJSMinSupportedVersion: '5.3.1',
    version: '99.9.9',
    name: '@okta/okta-angular',
  }
}));

@Component({ template: '' })
class MockComponent {}

function setup(oktaAuth: OktaAuth) {
  TestBed.configureTestingModule({
    imports: [
      RouterTestingModule.withRoutes([{ path: 'foo', redirectTo: '/foo' }]),
      OktaAuthModule
    ],
    declarations: [ MockComponent ],
    providers: [{
      provide: OKTA_CONFIG,
      useValue: {
        oktaAuth
      }
    }],
  });
  return TestBed.createComponent(MockComponent);
}

function setupForRoot(oktaAuth: OktaAuth) {
  TestBed.configureTestingModule({
    imports: [
      RouterTestingModule.withRoutes([{ path: 'foo', redirectTo: '/foo' }]),
      OktaAuthModule.forRoot({ oktaAuth })
    ],
    declarations: [ MockComponent ],
  });
  return TestBed.createComponent(MockComponent);
}

describe('Okta Module', () => {
  let oktaAuth: OktaAuth;

  beforeEach(() => {
    oktaAuth = {
      options: {},
      authStateManager: {
        updateAuthState: jest.fn(),
        getAuthState: jest.fn(),
        subscribe: jest.fn()
      },
      start: jest.fn(),
      _oktaUserAgent: {
        addEnvironment: jest.fn(),
        getVersion: jest.fn().mockReturnValue(`999.9.9`)
      },
    } as unknown as OktaAuth;
  });

  describe('constructor', () => {
    describe('auth-js major version compatibility', () => {
      it('should not throw when version matches', () => {
        expect(() => setup(oktaAuth)).not.toThrow();
      });

      it('throws when version not match', () => {
        oktaAuth = {
          ...oktaAuth,
          _oktaUserAgent: {
            addEnvironment: jest.fn(),
            // any major version before 5 should be invalid
            getVersion: jest.fn().mockReturnValue('0.9.9')
          }
        } as unknown as OktaAuth;
        expect(() => setup(oktaAuth)).toThrow(new AuthSdkError(`Passed in oktaAuth is not compatible with the SDK, minimum supported okta-auth-js version is 5.3.1.`));
      });
      
    });

    describe('Okta User Agent tracking', () => {
      it('adds sdk environment to oktaAuth instance', () => {
        setup(oktaAuth);
        expect(oktaAuth._oktaUserAgent.addEnvironment).toHaveBeenCalledWith('@okta/okta-angular/99.9.9');
      });
      it('throws if _oktaUserAgent is not exist', () => {
        oktaAuth = {
          ...oktaAuth,
          _oktaUserAgent: null
        } as unknown as OktaAuth;
        expect(() => setup(oktaAuth)).toThrow(new AuthSdkError(`Passed in oktaAuth is not compatible with the SDK, minimum supported okta-auth-js version is 5.3.1.`));
      });
    });
  
    describe('default restoreOriginalUri', () => {
      it('sets default restoreOriginalUri', () => {
        setup(oktaAuth);
        const injectedOktaAuth = TestBed.get(OKTA_AUTH);
        expect(injectedOktaAuth.options.restoreOriginalUri).toBeDefined();
      });
    });
  
    describe('Start service', () => {
      it('starts service', () => {
        setup(oktaAuth);
        expect(oktaAuth.start).toHaveBeenCalled();
      });
    });
  });

  describe('DI', () => {
    it('provides OktaAuth', () => {
      setup(oktaAuth);
      expect(TestBed.get(OKTA_AUTH)).toBeDefined();
    });
    it('provides AuthStateService', () => {
      setup(oktaAuth);
      expect(TestBed.get(OktaAuthStateService)).toBeDefined();
    });
    it('provides OktaAuthGuard', () => {
      setup(oktaAuth);
      expect(TestBed.get(OktaAuthGuard)).toBeDefined();
    });
  });

  describe('forRoot', () => {
    it('should not throw', () => {
      expect(() => setupForRoot(oktaAuth)).not.toThrow();
    });

    it('should provide OktaAuth', () => {
      setupForRoot(oktaAuth);
      expect(TestBed.get(OKTA_CONFIG)).toBeDefined();
      expect(TestBed.get(OKTA_AUTH)).toBeDefined();
    });

    it('should provide OktaAuthStateService', () => {
      setupForRoot(oktaAuth);
      expect(TestBed.get(OktaAuthStateService)).toBeDefined();
    });

    it('should provide OktaAuthGuard', () => {
      setupForRoot(oktaAuth);
      expect(TestBed.get(OktaAuthGuard)).toBeDefined();
    });
  });
  
});
