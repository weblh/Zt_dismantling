package com.zuantan.dismantling.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zuantan.dismantling.entity.JdyFormData;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface JdyFormDataMapper extends BaseMapper<JdyFormData> {

    @Select("SELECT COUNT(*) FROM jdy_form_data WHERE entry_id = #{entryId}")
    long countByEntryId(@Param("entryId") String entryId);

    @Select("SELECT COUNT(*) FROM jdy_form_data WHERE entry_id = #{entryId} "
            + "AND SUBSTRING(jdy_create_time, 1, 10) >= #{startDate} "
            + "AND SUBSTRING(jdy_create_time, 1, 10) < #{endDate}")
    long countByEntryIdDateRange(@Param("entryId") String entryId,
                                 @Param("startDate") String startDate,
                                 @Param("endDate") String endDate);

    @Select("SELECT COUNT(*) FROM jdy_form_data WHERE entry_id = #{entryId} "
            + "AND COALESCE(submit_date, DATE(SUBSTRING(jdy_create_time, 1, 10))) >= #{startDate} "
            + "AND COALESCE(submit_date, DATE(SUBSTRING(jdy_create_time, 1, 10))) < #{endDate}")
    long countByEntryIdBizDateRange(@Param("entryId") String entryId,
                                    @Param("startDate") String startDate,
                                    @Param("endDate") String endDate);

    @Select("SELECT COUNT(*) FROM jdy_form_data WHERE app_id = #{appId} AND entry_id = #{entryId}")
    long countByAppIdAndEntryId(@Param("appId") String appId, @Param("entryId") String entryId);

    @Select("SELECT COUNT(*) FROM jdy_form_data WHERE app_id = #{appId} AND entry_id = #{entryId} "
            + "AND COALESCE(submit_date, DATE(SUBSTRING(jdy_create_time, 1, 10))) >= #{startDate} "
            + "AND COALESCE(submit_date, DATE(SUBSTRING(jdy_create_time, 1, 10))) < #{endDate}")
    long countByAppIdAndEntryIdBizDateRange(@Param("appId") String appId,
                                            @Param("entryId") String entryId,
                                            @Param("startDate") String startDate,
                                            @Param("endDate") String endDate);
}
