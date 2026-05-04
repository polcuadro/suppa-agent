# Setting up donations on your suppa-agent

If you've forked suppa-agent and want to accept donations from your users, here's how.

## Option 1: GitHub Sponsors (recommended)

GitHub Sponsors has 0% platform fees and pays directly to your bank account.

1. Go to [github.com/sponsors](https://github.com/sponsors) and apply
2. Connect your bank account or Stripe
3. Edit `.github/FUNDING.yml` in your repo:
   ```yaml
   github: your_github_username
   ```
4. A "Sponsor" button appears on your repo automatically

## Option 2: Ko-fi

Ko-fi lets anyone send you a one-time payment. No account required for donors. Pays to your PayPal or bank via Stripe.

1. Create an account at [ko-fi.com](https://ko-fi.com)
2. Edit `.github/FUNDING.yml`:
   ```yaml
   ko_fi: your_username
   ```

## Option 3: Buy Me a Coffee

Similar to Ko-fi. Monthly or one-time.

1. Create an account at [buymeacoffee.com](https://www.buymeacoffee.com)
2. Edit `.github/FUNDING.yml`:
   ```yaml
   buy_me_a_coffee: your_username
   ```

## Option 4: Custom link (PayPal, Bizum, bank transfer page)

If you prefer PayPal, Bizum, or a page with your bank details (IBAN):

1. Create a simple page with your payment info (can be a GitHub Gist, a Notion page, or a static site)
2. Edit `.github/FUNDING.yml`:
   ```yaml
   custom: ["https://your-page-with-payment-info.com"]
   ```

## How it looks

Once you edit `FUNDING.yml` and push, GitHub shows a **💜 Sponsor** button at the top of your repo. Clicking it shows all the links you've configured.

## Privacy note

If you use a custom link with bank details (IBAN), that information will be public. Consider using an intermediary like PayPal or Ko-fi if you prefer not to share your bank details directly.
