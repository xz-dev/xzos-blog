// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://xzos.net',
  integrations: [mdx(), sitemap()],

  markdown: {
      shikiConfig: {
          theme: 'github-dark',
      },
	},

  image: {
      // Don't optimize images during development
      service: { entrypoint: 'astro/assets/services/sharp' },
	},

  // 301 重定向：从旧 WordPress URL 到新 Astro URL
  // 保留 SEO 权重，确保外部链接和搜索引擎结果正常工作
  redirects: {
    // AI/技术类
    '/ai-driven-manual-testing-revolution': '/blog/ai-driven-manual-testing-revolution',
    '/ai-write-post-observed-phenomena': '/blog/ai-write-post-observed-phenomena',
    '/azure-custom-vision-mi': '/blog/azure-custom-vision-mi',

    // 开发技巧类
    '/cut-and-move-runs-via-python-docx': '/blog/cut-and-move-runs-via-python-docx',
    '/webm-webp-to-gif-with-semi-transparency': '/blog/webm-webp-to-gif-with-semi-transparency',
    '/find-first-and-last-position-of-element-in-sorted-array': '/blog/find-first-and-last-position-of-element-in-sorted-array',
    '/range-sum-query-2d': '/blog/range-sum-query-2d',
    '/python3-use-raw-data-parsing-xml-gz-file': '/blog/python3-use-raw-data-parsing-xml-gz-file',
    '/dom4j-proguard-rules': '/blog/dom4j-proguard-rules',
    '/code-as-operating-system-upgradeall-2-development-plan': '/blog/code-as-operating-system-upgradeall-2-development-plan',
    '/how-to-swap-the-order-of-two-parents-of-a-git-commit': '/blog/how-to-swap-the-order-of-two-parents-of-a-git-commit',
    '/exa-only-show-dotfile': '/blog/exa-only-show-dotfile',

    // Linux/系统类
    '/arch-linux-hibernation-into-swap-file': '/blog/arch-linux-hibernation-into-swap-file',
    '/archlinux-desktop-environment-survival-guide': '/blog/archlinux-desktop-environment-survival-guide',
    '/archlinux-setup-guide': '/blog/archlinux-setup-guide',
    '/boot-windows-from-grub': '/blog/boot-windows-from-grub',
    '/change-root-file-system-from-ext4-to-xfs-on-archlinux': '/blog/change-root-file-system-from-ext4-to-xfs-on-archlinux',
    '/kde-minimum-installation-solution-for-arch-linux': '/blog/kde-minimum-installation-solution-for-arch-linux',
    '/kde-recommended-plugin-list': '/blog/kde-recommended-plugin-list',
    '/my-pacman-conf': '/blog/my-pacman-conf',
    '/reload-archlinux-with-timeshift': '/blog/reload-archlinux-with-timeshift',
    '/lvm-replace-hard-driveand-move-data': '/blog/lvm-replace-hard-driveand-move-data',
    '/mi-pro-install-fingerprint-gui': '/blog/mi-pro-install-fingerprint-gui',

    // 游戏类
    '/play-nierautomata-by-nvidia-steam': '/blog/play-nierautomata-by-nvidia-steam',
    '/play-overwatch-by-lutris-wine': '/blog/play-overwatch-by-lutris-wine',
    '/steam-for-linux-no-sound-when-streaming': '/blog/steam-for-linux-no-sound-when-streaming',
    '/ubuntu-fedora-nvidia': '/blog/ubuntu-fedora-nvidia',

    // 网络/科学上网类
    '/haproxy-shadowsocks': '/blog/haproxy-shadowsocks',
    '/load-balancing-v2ray-with-haproxy-and-docker': '/blog/load-balancing-v2ray-with-haproxy-and-docker',
    '/docker-deploy-v2ray': '/blog/docker-deploy-v2ray',
    '/websockettlscdnweb-apache2-deploys-v2ray': '/blog/websockettlscdnweb-apache2-deploys-v2ray',

    // Docker/DevOps类
    '/docker-install-wordpress': '/blog/docker-install-wordpress',

    // Android/设备类
    '/flash-android-rom-by-fastboot-payload_dumper': '/blog/flash-android-rom-by-fastboot-payload_dumper',
    '/honor-pad-2-adaptation-plan': '/blog/honor-pad-2-adaptation-plan',
    '/cancel-plan-honor-pad-2-lineage': '/blog/cancel-plan-honor-pad-2-lineage',
    '/fedora-ubuntu-lineageos': '/blog/fedora-ubuntu-lineageos',

    // 实用工具/生活类
    '/merge-google-photo-to-icloud-photo-china': '/blog/merge-google-photo-to-icloud-photo-china',
    '/update-12306-of-railway-ecard-id-information': '/blog/update-12306-of-railway-ecard-id-information',
    '/cat-estrus-press-the-base-of-the-tail-acupressure': '/blog/cat-estrus-press-the-base-of-the-tail-acupressure',
    '/dji-mimo-photo-date-fix': '/blog/dji-mimo-photo-date-fix',
    '/iphone-large-folder-transfer': '/blog/iphone-large-folder-transfer',
    '/pipewire-send-audio-to-multiple-devices': '/blog/pipewire-send-audio-to-multiple-devices',
    '/firefox-moved-from-stable-version-to-develop-version': '/blog/firefox-moved-from-stable-version-to-develop-version',
    '/kindle': '/blog/kindle',

    // 随笔/生活记录类
    '/hello-world': '/blog/hello-world',
    '/new-start': '/blog/new-start',
    '/good-night': '/blog/good-night',
    '/happy-520': '/blog/happy-520',
    '/essay-2018-05-28': '/blog/essay-2018-05-28',
    '/cet4-2018-06-16': '/blog/cet4-2018-06-16',
    '/near-end-of-semester-2018-06-19': '/blog/near-end-of-semester-2018-06-19',
    '/time-2018-12-20': '/blog/time-2018-12-20',
    '/our-dreams-are-bound': '/blog/our-dreams-are-bound',
    '/315': '/blog/315',
    '/dp-3t-privacy-health-code': '/blog/dp-3t-privacy-health-code',
  },
});