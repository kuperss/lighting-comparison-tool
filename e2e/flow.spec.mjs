import { expect, test } from '@playwright/test';

test('選類別 → 加入 4 款 → 只顯示差異 → 分享連結還原', async ({ page, context, isMobile }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await page.goto('./');
  await page.getByRole('button', { name: /崁燈/ }).first().click();
  await expect(page.getByRole('heading', { name: '比較崁燈' })).toBeVisible();

  // 熱門比較一鍵帶入 4 款
  await page.getByRole('button', { name: /波爾防眩崁燈：4 種規格/ }).click();
  await expect(page).toHaveURL(/c=downlight&m=D-7DOB5N,D-9DOB9N,D-12DOB12N,D-12DOB12N-DA/);

  if (!isMobile) {
    await expect(page.locator('.col')).toHaveCount(4);
    await expect(page.getByText('已選 4 / 4')).toBeVisible();
    // 只顯示差異：數值相同的列（例如輸入電壓）隱藏，只留有差異的列與型號、型錄頁碼
    await expect(page.locator('.grid--row', { hasText: '輸入電壓' })).toHaveCount(1);
    await page.getByRole('switch', { name: '只顯示差異' }).click();
    await expect(page.locator('.grid--row', { hasText: '輸入電壓' })).toHaveCount(0);
    await expect(page.locator('.grid--row.is-diff').filter({ has: page.locator('.grid__label', { hasText: /^光通量$/ }) })).toHaveCount(1);
    await expect(page.locator('.grid--row:not(.is-diff)')).toHaveText([/型號/, /型錄頁碼/]);

    // 欄內切換色溫 → 網址型號跟著換
    await page.locator('.col').first().getByRole('radio').first().click();
    await expect(page).toHaveURL(/m=D-7DOB5W,/);

    // 用選擇器更換第 4 欄
    await page.locator('.col__select').nth(3).click();
    await page.getByRole('textbox', { name: '搜尋機型' }).fill('15cm');
    await page.locator('.picker__item', { hasText: '15cm · 12W' }).first().click();
    await expect(page).toHaveURL(/m=D-7DOB5W,D-9DOB9N,D-12DOB12N,D-15DOB12N$/);
  } else {
    await expect(page.locator('.m-thumb')).toHaveCount(4);
    await expect(page.locator('.m-head')).toHaveCount(2);
    await page.locator('.m-thumb').nth(3).click();
    await expect(page.locator('.m-thumb.is-on')).toHaveCount(2);
    await page.getByRole('radio', { name: '只看差異' }).click();
  }

  // 分享連結還原同一個比較
  const url = page.url();
  const fresh = await context.newPage();
  await fresh.goto(url);
  await expect(isMobile ? fresh.locator('.m-thumb:not(.is-empty)') : fresh.locator('.col:not(.col--empty)')).toHaveCount(4);
});

test('產品列表加入比較匣，跨類別會提醒', async ({ page, isMobile }) => {
  await page.goto('./?v=list&c=can');
  const checks = page.locator('.check');
  await checks.nth(0).click();
  await checks.nth(1).click();
  if (isMobile) {
    await page.locator('.fab').click();
    await page.getByRole('button', { name: '開始比較' }).click();
  } else {
    await page.getByRole('button', { name: '比較 2 款 →' }).click();
  }
  await expect(page).toHaveURL(/c=can&m=/);

  await page.goto('./?v=list&c=strip');
  await page.locator('.check').first().click();
  await expect(page.getByRole('alertdialog')).toContainText('不同類別無法一起比較');
  await page.getByRole('button', { name: '清空並加入' }).click();
  await expect(page.locator('.card.is-on')).toHaveCount(1);
});

test('官網資料：範圍值、壽命、官網連結', async ({ page, isMobile }) => {
  test.skip(isMobile, '桌機檢查即可');
  await page.goto('./?c=ceiling&m=D-CEX45NSW,D-CEC24NSW');
  await expect(page.locator('.grid--row', { hasText: '消耗功率' })).toContainText('3~45W');
  await expect(page.locator('.grid--row', { hasText: '消耗功率' })).toContainText('2 / 24W');
  await expect(page.locator('.grid--row', { hasText: '壽命' })).toContainText('15,000小時');
  await expect(page.locator('.col__link').first()).toHaveAttribute('href', /dancelight\.com\.tw/);
});
