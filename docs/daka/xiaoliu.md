---
title: 小刘
aside: false
# 给 <div class="Layout"> 加个钩子类，用来单独收窄这页的上下留白（见 style/doc.css）
pageClass: daka-page
---

<script setup>
// 打卡数据在这个文件里：加记录就往 records 里补一行，日历月份范围改 range
import { records, range } from './xiaoliu.records'
</script>

<DakaBoard :records="records" :range="range" />
