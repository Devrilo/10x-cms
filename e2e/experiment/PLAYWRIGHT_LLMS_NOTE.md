# Important Note: Playwright llms.txt

## Status: Not Available ❌

Playwright **does not have** an official `llms.txt` file yet (as of November 2025).

## Workaround for Method 4

For **Method 4** of the experiment, we have two options:

### Option A: Use comprehensive documentation (RECOMMENDED)
Use the `PLAYWRIGHT_DOCS.md` file but include **additional** API documentation to simulate a more complete llms.txt-style context:

1. All of `PLAYWRIGHT_DOCS.md` (test fixtures, API context)
2. Full APIRequestContext API reference
3. Full expect/matchers documentation
4. Test configuration options

**Estimated token count:** ~5000-8000 tokens

This simulates what llms.txt **would** provide if it existed.

### Option B: Skip Method 4
If you prefer to only test methods 1-3, that's also valid for the experiment.

---

## For Method 4: Enhanced Context File

If you choose Option A, use the file: `PLAYWRIGHT_COMPREHENSIVE_DOCS.md`

This file will contain:
- Everything from `PLAYWRIGHT_DOCS.md`
- Complete APIRequestContext API reference (all methods)
- Complete test configuration options
- Advanced fixtures patterns
- TypeScript types and interfaces

This approach is **more realistic** than just using PLAYWRIGHT_DOCS.md again, as it simulates what a comprehensive LLM-optimized documentation file would contain.

---

## Action Required

When you reach Method 4 in your experiment:

1. Open `PLAYWRIGHT_COMPREHENSIVE_DOCS.md` in this folder
2. Copy the ENTIRE contents
3. Include it in your prompt to Claude Sonnet 3.5
4. Document the token count (estimate ~5000-8000 tokens)

This way, Method 4 will properly test the "maximum context" approach, even though Playwright doesn't have an official llms.txt.

---

## Alternative Tools with llms.txt

If you want to test with a framework that **does** have llms.txt:

- **Next.js**: https://nextjs.org/llms.txt ✅
- **Vite**: https://vitejs.dev/llms.txt ✅
- **Astro**: https://astro.build/llms.txt ✅
- **Supabase**: https://supabase.com/llms.txt ✅

However, sticking with Playwright is fine - we'll just create a comprehensive context manually.
