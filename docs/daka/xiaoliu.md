---
title: 小刘
aside: false
---

<script setup>
// 打卡数据在这个文件里：加记录就往 records 里补一行，日历月份范围改 range
import { records, range } from './xiaoliu.records'
</script>

<DakaBoard :records="records" :range="range" />
