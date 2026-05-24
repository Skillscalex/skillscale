# Skillscale Organization Project Setup

This project has been prepared to transition from a personal project to a GitHub Organization project. Follow these steps to complete the transfer.

## ✅ Completed Steps

- [x] Updated `plugin.json` author field from "kitmike" to "Skillscale"
- [x] Updated git remote URL to: `https://github.com/Skillscale/skillscale`
- [x] Committed configuration changes

## 📋 Next Steps - Complete on GitHub

### Step 1: Create the GitHub Organization (if not already created)

1. Go to [github.com/organizations/new](https://github.com/organizations/new)
2. Fill in the organization name as **Skillscale**
3. Complete the setup form and create the organization

### Step 2: Transfer the Repository

**Option A: Using GitHub Web Interface (Recommended)**

1. Go to your personal repository: [https://github.com/kitmike/skillscale/settings](https://github.com/kitmike/skillscale/settings)
2. Scroll down to "Danger Zone"
3. Click "Transfer" 
4. Enter the organization name: **Skillscale**
5. Confirm the transfer

**Option B: Using GitHub CLI**

```bash
gh repo transfer kitmike/skillscale --new-owner Skillscale
```

### Step 3: Update Local Repository (After Transfer)

Once the repository has been transferred on GitHub, update your local setup:

```bash
# Pull the latest changes
git pull origin main

# Verify the remote is correct
git remote -v
# Should show: origin  https://github.com/Skillscale/skillscale (fetch/push)
```

### Step 4: Update Additional References (Optional)

If you have any:
- Documentation linking to the old URL (change `github.com/kitmike/skillscale` → `github.com/Skillscale/skillscale`)
- CI/CD workflows
- Issue templates
- Contributing guidelines

Update them to reflect the new organization URL.

## 🔑 After Transfer

Once transferred, ensure:
- [ ] Repository is under `github.com/Skillscale/skillscale`
- [ ] Organization members have appropriate access levels
- [ ] Branch protection rules are configured if needed
- [ ] Webhooks/integrations point to the new organization URL
- [ ] Team assignments are set up

## 📝 Notes

- The commit `042fb3f` contains the organization configuration updates
- All code history and commits will be preserved during the transfer
- The transfer is reversible if done within 20 days via GitHub's archive settings

---

**Current Status**: Ready for GitHub organization transfer ✨
