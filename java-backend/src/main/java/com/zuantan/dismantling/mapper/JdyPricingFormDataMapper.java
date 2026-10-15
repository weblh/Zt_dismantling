package com.zuantan.dismantling.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zuantan.dismantling.entity.JdyPricingFormData;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface JdyPricingFormDataMapper extends BaseMapper<JdyPricingFormData> {

    @Select("SELECT COUNT(*) FROM jdy_pricing_form_data WHERE entry_id = #{entryId}")
    long countByEntryId(@Param("entryId") String entryId);

    @Select("SELECT COUNT(*) FROM jdy_pricing_form_data WHERE entry_id = #{entryId} "
            + "AND COALESCE(submit_date, DATE(SUBSTRING(jdy_create_time, 1, 10))) >= #{startDate} "
            + "AND COALESCE(submit_date, DATE(SUBSTRING(jdy_create_time, 1, 10))) < #{endDate}")
    long countByEntryIdBizDateRange(@Param("entryId") String entryId,
                                    @Param("startDate") String startDate,
                                    @Param("endDate") String endDate);
}
