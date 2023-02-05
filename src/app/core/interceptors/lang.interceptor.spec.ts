import { TestBed } from '@angular/core/testing';

import { LangInterceptor } from './lang.interceptor';

describe('LangInterceptor', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [LangInterceptor],
    })
  );

  it('should be created', () => {
    const interceptor: LangInterceptor = TestBed.inject(LangInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
