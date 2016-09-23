import { EchelonWebTracker2Page } from './app.po';

describe('echelon-web-tracker2 App', function() {
  let page: EchelonWebTracker2Page;

  beforeEach(() => {
    page = new EchelonWebTracker2Page();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
