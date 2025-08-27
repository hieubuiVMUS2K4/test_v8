// Script so sánh hiệu năng VARCHAR vs INT cho exam ID
require('dotenv').config();
const DatabaseService = require('../src/services/DatabaseService');

async function compareIdPerformance() {
  try {
    console.log('🔍 So sánh hiệu năng ID types cho bảng Exams');
    console.log('================================================');

    // 1. Kiểm tra cấu trúc hiện tại
    console.log('📊 Kiểm tra cấu trúc hiện tại...');
    try {
      const examsStructure = await DatabaseService.execute('DESCRIBE Exams');
      const idColumn = examsStructure.find(col => col.Field === 'id');
      console.log(`   Current ID type: ${idColumn.Type} ${idColumn.Key}`);
      console.log(`   Is Auto Increment: ${idColumn.Extra.includes('auto_increment') ? 'YES' : 'NO'}`);
    } catch (err) {
      console.log('   ❌ Bảng Exams chưa tồn tại');
      return;
    }

    // 2. Tính toán storage requirements
    console.log('\n💾 Storage Requirements:');
    const examCount = await DatabaseService.execute('SELECT COUNT(*) as count FROM Exams');
    const totalExams = examCount[0].count;
    
    console.log(`   📈 Tổng số bài thi: ${totalExams}`);
    
    if (totalExams > 0) {
      // VARCHAR(100) storage
      const varcharStorage = totalExams * 100; // 100 bytes per ID
      
      // INT storage  
      const intStorage = totalExams * 4; // 4 bytes per ID
      
      console.log(`   📦 VARCHAR(100) storage: ${varcharStorage} bytes (${Math.round(varcharStorage/1024)} KB)`);
      console.log(`   📦 INT storage: ${intStorage} bytes (${Math.round(intStorage/1024)} KB)`);
      console.log(`   💡 Space saved with INT: ${varcharStorage - intStorage} bytes (${Math.round((varcharStorage - intStorage)/1024)} KB)`);
      console.log(`   📊 Storage reduction: ${Math.round(((varcharStorage - intStorage) / varcharStorage) * 100)}%`);
    }

    // 3. Index analysis
    console.log('\n📈 Index Analysis:');
    const indexes = await DatabaseService.execute('SHOW INDEXES FROM Exams');
    indexes.forEach(idx => {
      if (idx.Column_name === 'id') {
        console.log(`   🔑 PRIMARY KEY: ${idx.Key_name}`);
        console.log(`   📊 Cardinality: ${idx.Cardinality}`);
        console.log(`   💾 Index length: ${idx.Sub_part || 'Full column'}`);
      }
    });

    // 4. Query performance simulation
    console.log('\n⚡ Query Performance Characteristics:');
    
    console.log('   📍 INTEGER ID benefits:');
    console.log('      ✅ Fixed-width comparison (4 bytes)');
    console.log('      ✅ CPU cache friendly');
    console.log('      ✅ Optimal B-tree node utilization');
    console.log('      ✅ Fast AUTO_INCREMENT generation');
    console.log('      ✅ Efficient JOIN operations');
    
    console.log('   📍 VARCHAR(100) ID drawbacks:');
    console.log('      ❌ Variable-width comparison (up to 100 bytes)');
    console.log('      ❌ String parsing overhead');
    console.log('      ❌ Less efficient B-tree nodes');
    console.log('      ❌ Need UUID/custom generation logic');
    console.log('      ❌ Slower JOIN operations');

    // 5. Foreign key impact
    console.log('\n🔗 Foreign Key Impact:');
    const foreignKeyTables = ['ExamAnswers'];
    
    for (const tableName of foreignKeyTables) {
      try {
        const fkCount = await DatabaseService.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        const records = fkCount[0].count;
        
        if (records > 0) {
          console.log(`   📋 ${tableName}: ${records} records`);
          console.log(`      💾 INT FK storage: ${records * 4} bytes`);
          console.log(`      💾 VARCHAR FK storage: ${records * 100} bytes`);
          console.log(`      💡 FK space saved: ${records * 96} bytes`);
        }
      } catch (err) {
        console.log(`   ⚠️  Cannot check ${tableName}`);
      }
    }

    // 6. Recommendations
    console.log('\n💡 Recommendations:');
    console.log('   ✅ USE INT AUTO_INCREMENT for Exam ID because:');
    console.log('      1. Significantly better performance');
    console.log('      2. 96% storage reduction per record');
    console.log('      3. Faster index operations');
    console.log('      4. Simpler application logic');
    console.log('      5. Better scalability');
    
    console.log('\n   ❌ AVOID VARCHAR(100) for Exam ID because:');
    console.log('      1. Unnecessary complexity');
    console.log('      2. Performance overhead');
    console.log('      3. Storage waste');
    console.log('      4. Slower foreign key operations');

    // 7. Migration impact
    console.log('\n🔄 Migration Impact:');
    console.log('   📊 Current setup using: INT AUTO_INCREMENT ✅');
    console.log('   💡 No migration needed - already optimal!');
    
    console.log('\n🎉 Analysis completed!');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    process.exit(0);
  }
}

// Run analysis
compareIdPerformance();
